import { logger } from "../../utils/logger";
import { s3 } from "../../utils/aws";

const uploadZabo = async (currentAdmin, zaboForm, zaboFiles) => {
  const adminName = currentAdmin.user.username;

  logger.admin.info("Upload Zabo; adminName: %s", adminName);

  const { title, description, schedules: jsonSchedules, category } = zaboForm;

  const schedules = parseJSON(jsonSchedules, []);

  category = (category || "")
    .toLowerCase()
    .split("#")
    .filter(x => !!x);

  if (!title || !description || !files) {
    logger.admin.error(
      "Upload Zabo Error: missing required fields; adminUser: %s",
      adminName,
    );
  }

  if (!currentAdmin.currentGroup) {
    logger.admin.error(
      "Upload Zabo Error: adminUser is not currently belonging to any group; adminUser: %s",
      adminName,
    );
  }

  let params;

  //use aws sdk s3 to upload image to aws s3 bucket
  for (let i = 0; i < zaboFiles.length; i += 1) {
    const filename = `${zaboCount}${Date.now().toString()}`;
    console.log(zaboFiles[i]);
    params = {
      Bucket: bucket,
      Key: `zabo/zabo-${filename}${path.extname("blob")}`,
      Body: zaboFiles[i],
    };

    console.log("uploading image to s3");
    console.log(params);
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
  }

  const newZabo = new Zabo({
    owner: currentAdmin.currentGroup,
    createdBy: currentAdmin._id,
    title,
    description,
    category,
    schedules,
  });

  const calSizes = [];
  for (let i = 0; i < zaboFiles.length; i += 1) {
    const s3ImageKey = zaboFiles[i].key;
    calSizes.push(sizeS3Item(s3ImageKey));
  }

  const results = await Promise.all(calSizes);

  const photos = await results.map(([dimensions, bytesRead], index) => ({
    url: files[index].location,
    width: dimensions.width,
    height: dimensions.height,
  }));

  newZabo.photos = newZabo.photos.concat(photos);
  await Promise.all([
    newZabo.save(),
    Group.findByIdAndUpdate(currentAdmin.currentGroup, {
      $set: { recentUpload: new Date() },
    }),
  ]);

  await newZabo
    .populate("owner", "name profilePhoto subtitle description")
    .execPopulate();

  const zaboJSON = newZabo.toJSON();
  zaboJSON.isLiked = false;
  zaboJSON.isPinned = false;

  return zaboJSON;
};

export default uploadZabo;
