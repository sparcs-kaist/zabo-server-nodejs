import AdminJSExpress from "@adminjs/express";
import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { componentLoader } from "./components";

import {
  AdminUser,
  User,
  DeletedZabo,
  Board,
  Group,
  Statistic,
  PreRegister,
  Meta,
  Device,
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
    Device,
    ZaboResource,
  ],
  componentLoader,
};

const admin = new AdminJS(adminOptions);
export const adminRouter = AdminJSExpress.buildRouter(admin);
export const adminRouterPath = admin.options.rootPath;
