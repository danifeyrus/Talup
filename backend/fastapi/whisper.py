import os
import tempfile
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from transformers import pipeline
from pydub import AudioSegment

ffmpeg_path = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.converter = ffmpeg_path
AudioSegment.ffmpeg = ffmpeg_path 

app = FastAPI()
asr_pipeline = pipeline("automatic-speech-recognition", model="t3ngr1/whisper-small-kk")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    print("📥 Получен файл:", file.filename)

    if not file.filename.endswith((".wav", ".m4a")):
        print("Неподдерживаемый формат:", file.filename)
        return JSONResponse(status_code=400, content={"error": "Поддерживаются только .wav и .m4a файлы."})

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, file.filename)

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    print("Сохранено во временный файл:", input_path)

    try:
        output_path = os.path.join(temp_dir, "converted.wav")
        audio = AudioSegment.from_file(input_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(output_path, format="wav")
        print("🔁 Конвертация прошла успешно:", output_path)
    except Exception as e:
        print("Ошибка конвертации:", e)
        return JSONResponse(status_code=500, content={"error": "Ошибка обработки аудио."})

    try:
        result = asr_pipeline(output_path)
        print("Распознано:", result["text"])
        return {"text": result["text"]}
    except Exception as e:
        print("Ошибка распознавания:", e)
        return JSONResponse(status_code=500, content={"error": "Ошибка при распознавании речи."})
