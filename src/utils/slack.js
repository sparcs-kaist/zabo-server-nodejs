import axios from "axios";
import { User } from "../db";

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const sendMessage = async message => {
  if (!WEBHOOK_URL) return;
  return axios.post(WEBHOOK_URL, { text: message });
};

const devLog =
  process.env.NODE_ENV !== "production"
    ? `
    [DEV]
  `
    : "";

export const sendNewApplyMessage = async (group, user) => {
  const { name, description, subtitle, purpose, category, isBusiness } = group;

  return sendMessage(`${devLog}
    ##새로운 그룹 신청이 있습니다.##
    <http://zabo.sparcs.org/admin/group/${name}|*link*> @channel
    *이름* : ${name}
    *사용 목적* : ${purpose}
    *한 줄 소개* : ${subtitle}
    *카테고리* : ${category}
    *비즈니스 계정* : ${isBusiness}
    --
    신청자 정보
    <http://zabo.sparcs.org/admin/user/${user.username}|*link*>
    *이름* : ${user.name} - ${user.username}
    *타입* : ${user.kaistPersonType}
  `);
};

export const sendApplyDoneMessage = async (groupName, adminUser) => {
  const user = await User.findById(adminUser.user);
  return sendMessage(`${devLog}
    *${groupName}* 그룹 승인 완료
    - by ${user.username}
  `);
};

export const sendRejectDoneMessage = async (groupName, adminUser) => {
  const user = await User.findById(adminUser.user);
  return sendMessage(`${devLog}
    *${groupName}* 그룹 거절 완료
    - by ${user.username}
  `);
};
