import { integer, pgTable, serial, text,date,json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  email: text('email').notNull().unique(), 
  dob:date().notNull(), //date
  profilePic:text("profilePic"), //stores the file url not the file
  gender:text("gender").notNull(), //radio
  skills:json("skills").notNull(), //checkbox
  bio:text("bio").notNull() //textarea
});
