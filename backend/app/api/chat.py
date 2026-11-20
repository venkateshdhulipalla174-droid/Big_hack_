from fastapi import APIRouter

from ..schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat")
def chat(request: ChatRequest) -> ChatResponse:
    return ChatResponse(response="Mock response", prompt=request.prompt)
