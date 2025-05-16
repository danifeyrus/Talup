from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import random
import difflib

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

def stem(word: str) -> str:
    suffixes = [
        "лар", "лер", "дар", "дер", "тар", "тер",
        "мын", "мін", "сың", "сің", "міз", "мыз", "сыз", "сіз",
        "дық", "дік", "тық", "тік", "лық", "лік",
        "ды", "ді", "ты", "ті", "ны", "ні",
    ]
    for suf in suffixes:
        if word.endswith(suf) and len(word) > len(suf) + 1:
            return word[:-len(suf)]
    return word

def is_similar(w1: str, w2: str) -> bool:
    s1, s2 = stem(w1.lower()), stem(w2.lower())
    if s1 == s2:
        return True
    ratio = difflib.SequenceMatcher(None, s1, s2).ratio()
    return ratio > 0.8

@app.post("/predict/")
def predict(input_data: InputText):
    try:
        result = pipe(input_data.text, top_k=30)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")

    exclude = {"", ".", ",", "?", "!", ";", ":", "-", "–", "—", "\"", "'", "…", "«", "»", "(", ")"}
    raw = [item["token_str"].strip().lower() for item in result]
    filtered = [w for w in raw if w not in exclude and w.isalpha()]

    unique = []
    for word in filtered:
        if is_similar(word, input_data.correct):
            continue
        if all(not is_similar(word, u) for u in unique):
            unique.append(word)
        if len(unique) == 3:
            break

    if len(unique) < 3:
        raise HTTPException(status_code=400, detail="Недостаточно разных слов")

    return {"words": unique}
