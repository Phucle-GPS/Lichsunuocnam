#!/usr/bin/env python3
"""Design a new mature male Vietnamese narrator voice with ElevenLabs, then create an MP3.

Requirements:
    pip install requests

Set ELEVENLABS_API_KEY in your environment before running.
Examples:
    python create_male_voice_elevenlabs.py --text "Xin chào, đây là bản đọc thử."
    python create_male_voice_elevenlabs.py --text-file script.txt --output narration.mp3

This designs a new voice using broad acoustic traits (not an exact copy of Charon).
The generated voice_id is saved to voice_id.txt for reuse in your application.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

BASE_URL = "https://api.elevenlabs.io/v1"
DESIGN_MODEL_ID = "eleven_multilingual_ttv_v2"
TTS_MODEL_ID = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"

# Describe vocal qualities, not a named voice identity. The Vietnamese preview text
# helps audition the designed voice in the language intended for narration.
VOICE_DESCRIPTION = (
    "A mature male Vietnamese narrator with a low, warm, smooth register; clear and "
    "precise diction; calm, measured pacing; a subtle resonant depth; restrained but "
    "expressive documentary delivery; easy to listen to for long-form FM narration. "
    "Keep the voice natural and steady, with no exaggerated gravel or theatrical acting. "
    "This is an original synthetic voice, not an imitation of a specific existing voice or person."
)

PREVIEW_TEXT = (
    "Xin kính chào quý vị đang lắng nghe. Trên dòng sông lặng gió, những con thuyền "
    "tiến dần vào vùng nước sâu. Phía trước, một trận quyết chiến đang chờ đợi. "
    "Câu chuyện hôm nay đưa chúng ta trở về những năm tháng hào hùng của lịch sử dân tộc."
)


def api_headers(api_key: str) -> dict[str, str]:
    return {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def request_json(method: str, url: str, *, api_key: str, **kwargs: Any) -> requests.Response:
    """Make an authenticated request and print a useful provider error if it fails."""
    response = requests.request(
        method,
        url,
        headers=api_headers(api_key),
        timeout=180,
        **kwargs,
    )
    if not response.ok:
        try:
            detail = json.dumps(response.json(), ensure_ascii=False, indent=2)
        except ValueError:
            detail = response.text
        raise RuntimeError(f"ElevenLabs returned HTTP {response.status_code}:\n{detail}")
    return response


def design_voice(api_key: str, output_dir: Path) -> str:
    """Generate preview candidates, save their audio, let the user choose, create voice."""
    url = f"{BASE_URL}/text-to-voice/design"
    payload = {
        "voice_description": VOICE_DESCRIPTION,
        "model_id": DESIGN_MODEL_ID,
        "text": PREVIEW_TEXT,
        "auto_generate_text": False,
        "should_enhance": True,
        "guidance_scale": 5,
    }
    response = request_json(
        "POST",
        url,
        api_key=api_key,
        params={"output_format": "mp3_22050_32"},
        json=payload,
    )
    data = response.json()
    previews = data.get("previews", [])
    if not previews:
        raise RuntimeError("The voice design endpoint returned no previews.")

    print("\nVoice previews (listen to the saved files before choosing):")
    for index, preview in enumerate(previews, start=1):
        encoded_audio = preview.get("audio_base_64")
        if encoded_audio:
            audio_path = output_dir / f"voice_preview_{index}.mp3"
            audio_path.write_bytes(base64.b64decode(encoded_audio))
            print(f"  {index}. {audio_path} ({preview.get('duration_secs', '?')} seconds)")
        else:
            print(f"  {index}. Preview audio was not included in the response.")

    while True:
        raw = input(f"Choose a preview number (1-{len(previews)}): ").strip()
        try:
            selected_index = int(raw) - 1
        except ValueError:
            print("Please enter a number.")
            continue
        if 0 <= selected_index < len(previews):
            break
        print(f"Enter a number from 1 to {len(previews)}.")

    chosen = previews[selected_index]
    generated_voice_id = chosen.get("generated_voice_id")
    if not generated_voice_id:
        raise RuntimeError("Selected preview did not include generated_voice_id.")

    create_url = f"{BASE_URL}/text-to-voice"
    create_payload = {
        "voice_name": "Vietnamese FM Documentary Narrator - Male",
        "voice_description": VOICE_DESCRIPTION,
        "generated_voice_id": generated_voice_id,
        "labels": {
            "language": "vi",
            "style": "documentary narration",
            "gender": "male",
        },
    }
    created = request_json(
        "POST",
        create_url,
        api_key=api_key,
        json=create_payload,
    ).json()
    voice_id = created.get("voice_id")
    if not voice_id:
        raise RuntimeError(f"Voice creation response did not include voice_id: {created}")

    (output_dir / "voice_id.txt").write_text(voice_id + "\n", encoding="utf-8")
    (output_dir / "voice_details.json").write_text(
        json.dumps(created, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return voice_id


def synthesize_mp3(api_key: str, voice_id: str, text: str, output_path: Path) -> None:
    """Convert the supplied Vietnamese text to MP3 with the selected voice."""
    url = f"{BASE_URL}/text-to-speech/{quote(voice_id, safe='')}"
    payload = {
        "text": text,
        "model_id": TTS_MODEL_ID,
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.80,
            "style": 0.15,
            "speed": 0.95,
            "use_speaker_boost": True,
        },
    }
    response = requests.post(
        url,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        params={"output_format": OUTPUT_FORMAT},
        json=payload,
        timeout=300,
    )
    if not response.ok:
        try:
            detail = json.dumps(response.json(), ensure_ascii=False, indent=2)
        except ValueError:
            detail = response.text
        raise RuntimeError(f"ElevenLabs returned HTTP {response.status_code}:\n{detail}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(response.content)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    text_group = parser.add_mutually_exclusive_group(required=True)
    text_group.add_argument("--text", help="Text to synthesize.")
    text_group.add_argument("--text-file", type=Path, help="UTF-8 text file to synthesize.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("narration.mp3"),
        help="Output MP3 path (default: narration.mp3).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("elevenlabs_voice_output"),
        help="Directory for previews and saved voice metadata.",
    )
    parser.add_argument(
        "--voice-id",
        help="Reuse an existing ElevenLabs voice_id; omit to design and create a new voice.",
    )
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        print("Error: set ELEVENLABS_API_KEY in your environment first.", file=sys.stderr)
        return 2

    if args.text_file:
        try:
            text = args.text_file.read_text(encoding="utf-8").strip()
        except OSError as exc:
            print(f"Could not read {args.text_file}: {exc}", file=sys.stderr)
            return 2
    else:
        text = args.text.strip()

    if not text:
        print("Error: input text is empty.", file=sys.stderr)
        return 2

    args.output_dir.mkdir(parents=True, exist_ok=True)
    try:
        if args.voice_id:
            voice_id = args.voice_id
            print(f"Reusing supplied voice_id: {voice_id}")
        else:
            voice_id = design_voice(api_key, args.output_dir)
            print(f"Created new voice_id: {voice_id}")

        synthesize_mp3(api_key, voice_id, text, args.output)
    except (requests.RequestException, RuntimeError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"\nMP3 saved to: {args.output.resolve()}")
    print(f"Voice ID saved to: {(args.output_dir / 'voice_id.txt').resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
