from app.ocr.image_cropper import crop_image
from app.ocr.text_recognizer import extract_text


cropped_path = crop_image(
    "data/ocr/pages/page_1.png",
    "data/ocr/question_1.png",
    100,
    800,
    1500,
    1900
)

text = extract_text(cropped_path)

print("===== QUESTÃO RECORTADA =====")
print(text)