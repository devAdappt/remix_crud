import { Form, useActionData, useLoaderData, useNavigation   } from "@remix-run/react";
import { db } from "~/db/client";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { useState, useEffect} from "react";
import Tables from "~/components/Tables";
import { formField } from "~/utils/formConfig";
import fs, { writeFile } from "fs/promises"; 
import path from "path"; 

type User = {
  id: number;
  name: string;
  age: number;
  email: string;
  dob: string;
  profilePic: string | null;
  gender: string;
  skills: string[];
  bio: string;
};

type ActionData = {
  success?: string;
  error?: string;
};

export async function loader() {
  const userList = await db.select().from(users);

  // Ensure skills is always an array of strings
  const formattedUsers: User[] = userList.map((user) => ({
    ...user,
    skills: Array.isArray(user.skills) ? (user.skills as string[]) : [], // ✅ Ensure skills is always a string array
  }));

  return formattedUsers;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  try {
    if (intent === "create") {
      const profilePic = formData.get("profilePic") as File | null;

      let profilePicPath = null;

      if (profilePic && profilePic.size > 0) {
        const uploadDir = path.join(process.cwd(), "public/uploads");

        // Ensure the upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        const fileExtension = profilePic.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file to the uploads directory
        const fileBuffer = await profilePic.arrayBuffer();
        await writeFile(filePath, Buffer.from(fileBuffer));

        // Store relative path in the database
        profilePicPath = `/uploads/${fileName}`;
      }

      const newUser = {
        name: formData.get("name") as string,
        age: Number(formData.get("age")),
        email: formData.get("email") as string,
        dob: formData.get("dob") as string,
        gender: formData.get("gender") as string,
        skills: formData.getAll("skills") as string[] || [],
        bio: formData.get("bio") as string,
        profilePic: profilePicPath, // Store file path
      };

      await db.insert(users).values(newUser);
      return { success: "User created successfully!" };
    }

    if (intent === "update") {
      const id = Number(formData.get("id"));

      const updateUser = {
        name: formData.get("name") as string,
        age: Number(formData.get("age")),
        email: formData.get("email") as string,
        dob: formData.get("dob") as string,
        gender: formData.get("gender") as string,
        skills: formData.getAll("skills") as string[],
        bio: formData.get("bio") as string,
      };

      if (
        !updateUser.name ||
        !updateUser.email ||
        isNaN(updateUser.age) ||
        !updateUser.dob ||
        !updateUser.gender ||
        !updateUser.skills ||
        !updateUser.bio
      ) {
        return new Response(
          JSON.stringify({ error: "All fields are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await db.update(users).set(updateUser).where(eq(users.id, id));
      return { success: "User updated successfully!" };
    }

    if (intent === "delete") {
      const id = Number(formData.get("id"));
      await db.delete(users).where(eq(users.id, id));
      return { success: "User deleted successfully!" };
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Something went wrong!" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function Users() {
  const users = useLoaderData<User[]>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation(); 

  const [editUser, setEditUser] = useState<User | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); 

  useEffect(() => {
    if (navigation.state === "idle" && actionData?.success) {
      setEditUser(null); 
      setPreviewImage(null); 
      document.querySelector("form")?.reset(); 
    }
  }, [navigation.state, actionData]);

  // Handle file input change to show image preview
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    } else {
      setPreviewImage(null);
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Users</h1>

      {/* Success & Error Messages */}
      {actionData?.success && (
        <p className="text-green-600 text-center">{actionData.success}</p>
      )}
      {actionData?.error && (
        <p className="text-red-600 text-center">{actionData.error}</p>
      )}

      {/* Create & Edit User Form */}
      <Form
        method="post"
        encType="multipart/form-data" 
        className="flex flex-col gap-3 bg-white p-4 rounded-lg shadow mb-6"
      >
        {editUser && <input type="hidden" name="id" value={editUser.id} />}

        {formField.map((field) => (
          <div key={field.name}>
            <label className="block text-gray-700 font-semibold mb-1">
              {field.label}
            </label>

            {["text", "email", "number", "date"].includes(field.type) && (
              <input
                type={field.type}
                name={field.name}
                defaultValue={editUser ? String(editUser[field.name as keyof User] ?? "") : ""}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                name={field.name}
                defaultValue={editUser ? editUser[field.name as keyof User]?.toString() : ""}
                className="w-full border border-gray-300 rounded px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}

            {field.type === "radio" &&
              field.options?.map((option) => (
                <label key={option} className="inline-flex items-center mr-3">
                  <input
                    type="radio"
                    name={field.name}
                    value={option}
                    defaultChecked={editUser?.gender === option}
                    className="mr-1"
                  />
                  {option}
                </label>
              ))}

            {field.type === "checkbox" &&
              field.options?.map((option) => (
                <label key={option} className="inline-flex items-center mr-3">
                  <input
                    type="checkbox"
                    name={field.name}
                    value={option}
                    defaultChecked={editUser ? editUser.skills.includes(option) : false}
                    className="mr-1"
                  />
                  {option}
                </label>
              ))}

            {/* File Input for Profile Picture */}
            {field.type === "file" && (
              <div>
                <input
                  type="file"
                  name="profilePic"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {/* Image Preview */}
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="mt-2 w-24 h-24 object-cover rounded-full border"
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          name="_intent"
          value={editUser ? "update" : "create"}
          className={`p-2 rounded text-white ${
            editUser ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {editUser ? "Update User" : "Add User"}
        </button>
        {editUser && (
          <button
            type="button"
            onClick={() => {
              setEditUser(null);
              setPreviewImage(null);
            }}
            className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </Form>

      {/* User List */}
      <Tables
        data={users}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "age", label: "Age" },
          { key: "dob", label: "DOB" },
          { key: "gender", label: "Gender" },
          {
            key: "skills",
            label: "Skills",
            render: (user) =>
              Array.isArray(user.skills) ? user.skills.join(",") : "No Skills",
          },
          { key: "bio", label: "Bio" },
          {
            key: "profilePic",
            label: "Profile Picture",
            render: (user) =>
              user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  className="w-12 h-12 rounded-full border"
                />
              ) : (
                "No Image"
              ),
          },
        ]}
        actions={(user) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditUser(user);
                setPreviewImage(user.profilePic || null);
              }}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Edit
            </button>
            <Form method="post">
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                name="_intent"
                value="delete"
                className="bg-red-500 text-white p-2 rounded"
              >
                Delete
              </button>
            </Form>
          </div>
        )}
      />
    </div>
  );
}