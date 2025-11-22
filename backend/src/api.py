from fastapi import APIRouter, HTTPException, status
from .models import VisualizeRequest, GraphResult, ConfigFormat
from .parser import parse_configs, ParseError
from .extractor import Extractor
from .graph_builder import GraphBuilder

router = APIRouter()

@router.post("/visualize", response_model=GraphResult)
async def visualize(request: VisualizeRequest):
    # 1. Parse
    try:
        parsed_config = parse_configs(request.configs, request.format)
    except ParseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 2. Extract
    try:
        extractor = Extractor(parsed_config)
        extracted_data = extractor.extract()
    except Exception as e:
        # In a real app, we might want to log the stack trace
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extraction failed: {str(e)}"
        )

    # 3. Build Graph
    try:
        builder = GraphBuilder(extracted_data)
        graph_result = builder.build()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Graph construction failed: {str(e)}"
        )

    return graph_result
