import { FormField } from "../types/types";

export const formField : FormField[]=[          
    {name:"name",label:"Name", type:"text"},
    {name:"email",label:"Email", type:"text"},
    {name:"age",label:"Age", type:"number"},
    {name:"dob",label:"Date of Birth", type:"date"},
    {name:"profilePic",label:"Profile Picture", type:"file"},
    {name:"gender",label:"Gender", type:"radio", options:["Male","Female","Others"]},
    {name:"skills",label:"Skills", type:"checkbox", options:["JS", "Python", "Java"]},
    {name:"bio",label:"Bio", type:"textarea"}
]