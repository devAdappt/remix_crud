export type FormField = {
    name:string,
    label:string,
    type:"text" | "email" | "number" | "date" | "file" | "textarea" | "radio" | "checkbox",
    options? :string[]
}