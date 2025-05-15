from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import random

MODEL_PATH = "./kaz-roberta-conversational"
app = FastAPI()

try:
    pipe = pipeline("fill-mask", model=MODEL_PATH)
except Exception as e:
    print("Ошибка загрузки модели:", e)
    raise

class InputText(BaseModel):
    text: str
    correct: str

@app.post("/predict/")
def predict(input_data: InputText):
    try:
        result = pipe(input_data.text, top_k=30)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")

    exclude = {"", ".", ",", "?", "!", ";", ":", "-", "–", "—", "\"", "'", "…", "«", "»", "(", ")"}
    raw = [item["token_str"].strip().lower() for item in result]
    filtered = [w for w in raw if w not in exclude and w.isalpha()]

    def is_similar_stem(w1, w2, length=4):
        return w1[:length] == w2[:length]

    unique = []
    for word in filtered:
        if is_similar_stem(word, input_data.correct):
            continue
        if all(not is_similar_stem(word, u) for u in unique):
            unique.append(word)
        if len(unique) == 3:
            break

    if len(unique) < 3:
        raise HTTPException(status_code=400, detail="Недостаточно разных слов")

    return {"words": unique}
