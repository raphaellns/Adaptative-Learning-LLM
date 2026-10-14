import pytesseract

from PIL import Image


def extract_text(
    image_path: str,
    page_segmentation_mode: int = 3
):
    with Image.open(image_path) as image:
        text = pytesseract.image_to_string(
            image,
            lang="por",
            config=f"--psm {page_segmentation_mode}"
        )

    return text