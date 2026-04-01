const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const { PDFParse } = require("pdf-parse");
const PDFKit = require("pdfkit");

const libre = require("libreoffice-convert");
const util = require("util");

const { Document, Packer, Paragraph, TextRun } = require("docx");
const mammoth = require("mammoth");
const PptxGenJS = require("pptxgenjs");

const { PDFDocument } = require("pdf-lib");

// Use a manual promise wrapper to avoid promisify warnings on hybrid functions
const libreConvert = (buf, format, undefinedVal) => {
    return new Promise((resolve, reject) => {
        libre.convert(buf, format, undefinedVal, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

/* ------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------ */

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const parsePdfText = async (dataBuffer) => {
    const parser = new PDFParse({ data: dataBuffer });
    try {
        const result = await parser.getText();
        const text = (typeof result === "string") ? result : (result?.text || "");
        return text;
    } catch (err) {
        console.error("PDFParser: Error during getText():", err);
        throw err;
    } finally {
        try {
            await parser.destroy();
        } catch (destroyErr) {
            console.warn("PDFParser: Error destroying parser:", destroyErr.message);
        }
    }
};

/* ------------------------------------------------ */
/* LIBREOFFICE CONVERSION */
/* ------------------------------------------------ */

const convertViaLibre = async (inputPath, outputPath, format) => {
    const inputBuf = fs.readFileSync(inputPath);

    const outputBuf = await libreConvert(inputBuf, `.${format}`, undefined);

    fs.writeFileSync(outputPath, outputBuf);
};

/* ------------------------------------------------ */
/* IMAGE → PDF */
/* ------------------------------------------------ */

const imageToPdf = async (input, output) => {
    const metadata = await sharp(input).metadata();

    return new Promise((resolve, reject) => {
        const doc = new PDFKit({ autoFirstPage: false });

        const stream = fs.createWriteStream(output);

        doc.pipe(stream);

        doc.addPage({
            size: [metadata.width, metadata.height],
        });

        doc.image(input, 0, 0);

        doc.end();

        stream.on("finish", resolve);
        stream.on("error", reject);
    });
};

/* ------------------------------------------------ */
/* IMAGE → PPT */
/* ------------------------------------------------ */

const imageToPpt = async (input, output) => {
    const pres = new PptxGenJS();

    const slide = pres.addSlide();

    slide.addImage({
        path: input,
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 5,
    });

    await pres.writeFile({ fileName: output });
};

/* ------------------------------------------------ */
/* DOCX → PDF FALLBACK */
/* ------------------------------------------------ */

const convertDocxToPdfFallback = async (inputPath, outputPath) => {
    const result = await mammoth.extractRawText({ path: inputPath });

    return new Promise((resolve, reject) => {
        const doc = new PDFKit();

        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        doc.text(result.value);

        doc.end();

        stream.on("finish", resolve);
        stream.on("error", reject);
    });
};

/* ------------------------------------------------ */
/* PDF → DOCX FALLBACK */
/* ------------------------------------------------ */

const convertPdfToDocxFallback = async (inputPath, outputPath) => {
    const buffer = fs.readFileSync(inputPath);

    const text = await parsePdfText(buffer);

    const doc = new Document({
        sections: [
            {
                children: text.split("\n").map(
                    (line) =>
                        new Paragraph({
                            children: [new TextRun(line)],
                        })
                ),
            },
        ],
    });

    const docBuffer = await Packer.toBuffer(doc);

    fs.writeFileSync(outputPath, docBuffer);
};

/* ------------------------------------------------ */
/* CONVERSION MAP */
/* ------------------------------------------------ */

const conversionMap = {
    /* TEXT */

    "txt-pdf": async (input, output) => {
        const text = fs.readFileSync(input, "utf8");

        return new Promise((resolve, reject) => {
            const doc = new PDFKit();

            const stream = fs.createWriteStream(output);

            doc.pipe(stream);

            doc.text(text);

            doc.end();

            stream.on("finish", resolve);
            stream.on("error", reject);
        });
    },

    "pdf-txt": async (input, output) => {
        const buffer = fs.readFileSync(input);

        const text = await parsePdfText(buffer);

        fs.writeFileSync(output, text);
    },

    /* IMAGE */

    "jpg-png": (i, o) => sharp(i).png().toFile(o),
    "png-jpg": (i, o) => sharp(i).jpeg().toFile(o),
    "jpeg-png": (i, o) => sharp(i).png().toFile(o),

    "jpg-pdf": imageToPdf,
    "png-pdf": imageToPdf,
    "jpeg-pdf": imageToPdf,

    "jpg-pptx": imageToPpt,
    "png-pptx": imageToPpt,
    "jpeg-pptx": imageToPpt,

    /* PDF */

    "pdf-png": (i, o) => convertViaLibre(i, o, "png"),
    "pdf-jpg": (i, o) => convertViaLibre(i, o, "jpg"),

    "pdf-docx": async (i, o) => {
        try {
            await convertViaLibre(i, o, "docx");
        } catch {
            await convertPdfToDocxFallback(i, o);
        }
    },

    "pdf-compress": async (input, output) => {
        const bytes = fs.readFileSync(input);

        const pdf = await PDFDocument.load(bytes);

        const newBytes = await pdf.save({
            useObjectStreams: true,
        });

        fs.writeFileSync(output, newBytes);
    },

    /* DOC */

    "docx-pdf": async (i, o) => {
        try {
            await convertViaLibre(i, o, "pdf");
        } catch {
            await convertDocxToPdfFallback(i, o);
        }
    },

    "doc-pdf": async (i, o) => {
        try {
            await convertViaLibre(i, o, "pdf");
        } catch (err) {
            console.error("doc-pdf conversion failed:", err);
            throw new Error("DOC to PDF conversion requires LibreOffice installed on the server.");
        }
    },

    /* PPT */

    "ppt-pdf": (i, o) => convertViaLibre(i, o, "pdf"),
    "pptx-pdf": (i, o) => convertViaLibre(i, o, "pdf"),

    "pdf-ppt": (i, o) => convertViaLibre(i, o, "ppt"),
    "pdf-pptx": (i, o) => convertViaLibre(i, o, "pptx"),
};

/* ------------------------------------------------ */
/* MAIN CONVERSION SERVICE */
/* ------------------------------------------------ */

const convertFileService = async (inputPath, targetFormat) => {
    const outputDir = path.join(__dirname, "../../converted");

    ensureDir(outputDir);

    const inputExt = path.extname(inputPath).replace(".", "").toLowerCase();

    const filename = path.basename(inputPath, path.extname(inputPath));

    const outputFilename = `${filename}-${Date.now()}.${targetFormat}`;

    const outputPath = path.join(outputDir, outputFilename);

    const key = `${inputExt}-${targetFormat}`;

    const converter = conversionMap[key];

    if (!converter) {
        throw new Error(`Unsupported conversion: ${key}`);
    }

    await converter(inputPath, outputPath);

    return {
        path: outputPath,
        filename: outputFilename,
    };
};

/* ------------------------------------------------ */
/* PDF MERGE */
/* ------------------------------------------------ */

const mergePdfs = async (inputs, output) => {
    const merged = await PDFDocument.create();

    for (const file of inputs) {
        const pdf = await PDFDocument.load(fs.readFileSync(file));

        const pages = await merged.copyPages(pdf, pdf.getPageIndices());

        pages.forEach((p) => merged.addPage(p));
    }

    fs.writeFileSync(output, await merged.save());
};

/* ------------------------------------------------ */
/* PDF SPLIT */
/* ------------------------------------------------ */

const splitPdf = async (inputPath, outputPath, startPage, endPage) => {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  
  const totalPages = pdfDoc.getPageCount();
  const start = Math.max(1, startPage);
  const end = Math.min(totalPages, endPage);
  
  if (start > end) {
    throw new Error(`Invalid range: ${start}-${end}`);
  }
  
  const indices = [];
  for (let i = start - 1; i < end; i++) {
    indices.push(i);
  }
  
  const copiedPages = await newPdf.copyPages(pdfDoc, indices);
  copiedPages.forEach(page => newPdf.addPage(page));
  
  const pdfBytes = await newPdf.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return { pageCount: indices.length, totalPages };
};

/* ------------------------------------------------ */
/* IMAGE MERGE */
/* ------------------------------------------------ */

const mergeImagesToPdf = async (inputPaths, outputPath) => {
  const doc = new PDFKit();
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  for (let i = 0; i < inputPaths.length; i++) {
    const inputPath = inputPaths[i];
    if (fs.existsSync(inputPath)) {
      const metadata = await sharp(inputPath).metadata();
      if (i > 0) doc.addPage();
      doc.image(inputPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    }
  }
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

const mergeImagesToPptx = async (inputPaths, outputPath) => {
  const pres = new PptxGenJS();
  for (const inputPath of inputPaths) {
    if (fs.existsSync(inputPath)) {
      const slide = pres.addSlide();
      slide.addImage({ path: inputPath, x: 0.5, y: 0.5, w: 9, h: 5 });
    }
  }
  const data = await pres.write("nodebuffer");
  fs.writeFileSync(outputPath, data);
};

/* ------------------------------------------------ */
/* DIRECT TEXT → PDF */
/* ------------------------------------------------ */

const convertDirectTextToPdf = async (text, outputFilename) => {
  const outputDir = path.join(__dirname, "../../converted");
  ensureDir(outputDir);
  const outputPath = path.join(outputDir, outputFilename);

  return new Promise((resolve, reject) => {
    const doc = new PDFKit();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    doc.text(text);
    doc.end();
    stream.on("finish", () => resolve({ path: outputPath, filename: outputFilename }));
    stream.on("error", reject);
  });
};

/* ------------------------------------------------ */
/* EXPORT */
/* ------------------------------------------------ */

module.exports = {
    convertFileService,
    mergePdfs,
    splitPdf,
    mergeImagesToPdf,
    mergeImagesToPptx,
    convertDirectTextToPdf,
};