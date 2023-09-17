import fs from "fs";
import path from "path";

/**
 * @param {{
 *   id: string;
 *   title: string;
 *   description: string;
 *   img: string;
 *   imgWidth: number;
 *   imgHeight: number;
 * }} props
 * @returns {Promise<string>}
 */
export const renderMeta = async props => {
  const template = await fs.promises.readFile(
    path.join(__dirname, "template.html"),
  );

  return Object.entries(props).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    template.toString(),
  );
};
