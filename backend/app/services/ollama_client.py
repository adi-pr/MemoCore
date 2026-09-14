import ollama
import requests
from config.config import LLM_MODEL, EMBEDDING_MODEL, OLLAMA_HOST, LMSTUDIO_HOST

import time


_client = ollama.Client(
    host=OLLAMA_HOST,
)

def generate(
    prompt: str,
    model: str = LLM_MODEL,
    stream: bool = False,
):
    t0 = time.time()

    print("Prompt size:", len(prompt))
    print("Prompt sent to LM Studio:", prompt)

    payload = {
        "model": model,
        "input": prompt,
    }

    if stream:
        payload["stream"] = True

    response = requests.post(
        f"{LMSTUDIO_HOST}/api/v1/chat",
        headers={
            "Content-Type": "application/json",
        },
        json=payload,
        stream=stream,
        timeout=600,
    )

    response.raise_for_status()

    if stream:
        for line in response.iter_lines(decode_unicode=True):
            if line:
                print(line)
                yield line
    else:
        data = response.json()

        t1 = time.time()
        print(f"LM Studio response time: {t1 - t0:.2f} seconds")

        # LM Studio /api/v1/chat response
        return data

def embed(text, model: str = EMBEDDING_MODEL):
    t0 = time.time()

    response = _client.embeddings(
        model=model,
        prompt=text
    )

    t1 = time.time()
    print(f"Ollama embedding response time: {t1 - t0:.2f} seconds")
    
    return response["embedding"]