import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";

import {
  AdminUser,
  User,
  DeletedZabo,
  Board,
  Group,
  Statistic,
  PreRegister,
  Meta,
} from "../db";

import { GroupResource } from "./resources/Group";
import { ZaboResource } from "./resources/Zabo";
import { AdminUserResource } from "./resources/AdminUser";

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const adminOptions = {
  resources: [
    AdminUserResource,
    User,
    DeletedZabo,
    Board,
    GroupResource,
    Group,
    Statistic,
    PreRegister,
    Meta,
    ZaboResource,
  ],
};

export const adminZaboGroup = {
  name: "관리자 그룹",
  description: "관리자 그룹",
  subtitle: "관리자 그룹",
  purpose: "관리자 그룹",
  category: "관리자그룹",
  isBusiness: false,
};

const admin = new AdminJS(adminOptions);
export const adminRouter = AdminJSExpress.buildRouter(admin);
export const adminRouterPath = admin.options.rootPath;
