import { ObjectId } from "mongodb";

export interface UserDocument {
  _id?: ObjectId;
  googleId: string;
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture: string;
  provider: "google" | "local";
  createdAt: Date;
  updatedAt: Date;
}
