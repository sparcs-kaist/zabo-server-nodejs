import ash from "express-async-handler";
import { Zabo } from "../db";
import { renderMeta } from "../utils/seo/renderMeta";

export const shareZabo = ash(async (req, res) => {
  const { zaboId } = req.params;

  const zabos = await Zabo.aggregate([
    { $addFields: { id: { $substr: [{ $toString: "$_id" }, 18, -1] } } },
    { $match: { id: zaboId } },
    { $limit: 1 },
  ]);
  const zabo = await Zabo.populate(zabos[0], { path: "photos" });

  if (!zabo) return res.redirect("/404");

  return res.send(
    await renderMeta({
      id: zabo._id,
      title: zabo.title,
      description: zabo.description.replace(/<[^>]*>/g, ""),
      img: zabo.photos[0].url,
      imgWidth: zabo.photos[0].width,
      imgHeight: zabo.photos[0].height,
    }),
  );
});
