from pathlib import Path

import fitz


def pdf_to_images(pdf_path: str, output_dir: str):
    pdf = fitz.open(pdf_path)

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    generated_images = []

    for page_number, page in enumerate(pdf):
        pixmap = page.get_pixmap(dpi=200)

        image_path = output_path / f"page_{page_number + 1}.png"

        pixmap.save(image_path)

        generated_images.append(str(image_path))

    pdf.close()

    return generated_images