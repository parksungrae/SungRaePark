// public/images의 사진을 알림용(720x360, 2:1)으로 잘라 public/alarm-photos/01.jpg ~ 에 저장한다.
// 사진을 추가·삭제하면 다시 실행하고, public/sw.js의 PHOTO_COUNT를 출력된 장수로 맞출 것.
// 실행: node scripts/make-alarm-photos.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SRC = "public/images";
const OUT = "public/alarm-photos";

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f)).sort();
  for (const [i, file] of files.entries()) {
    const name = `${String(i + 1).padStart(2, "0")}.jpg`;
    await sharp(path.join(SRC, file))
      .rotate()
      .resize(720, 360, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(path.join(OUT, name));
    console.log(`${name} <- ${file}`);
  }
  console.log(`\n${files.length}장 생성. public/sw.js의 PHOTO_COUNT = ${files.length}`);
})();
