import { connect } from "@/dbConfig/dbConfig";
import users  from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs" ;

export async function POST(request: NextRequest){
    try{
        const reqBody  = await request.json();
        var { username, email, password } = reqBody

        //console.log(reqBody); // remove in PROD

        await connect();

        // check if user already exists
        const euser = await users.findOne({email});
        if(euser){
            return NextResponse.json({error: "User already exists! !", success: false}, {status: 400});
        }

        //hashing of password
        const salt = await bcryptjs.genSaltSync(10); 
        password = await bcryptjs.hashSync(password, salt);

        const newUser = new users({
            username,
            email,
            password
        })

        const savedUser = await newUser.save();
        console.log(savedUser);

        return NextResponse.json({message: "User created successfully !", success: true}, {status: 201});
        

    } catch(error: any){
        return NextResponse.json({error: error.message, success: false}, {status: 500});
    }
}