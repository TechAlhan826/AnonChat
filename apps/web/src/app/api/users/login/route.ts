import { connect } from "@/dbConfig/dbConfig";
import users  from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs" ;
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest){
    try{
        const reqBody  = await request.json();
        var { email, password } = reqBody;


        //console.log(reqBody); // remove in PROD 

        await connect();

        const euser = await users.findOne({ email });

        if(!euser){
        return NextResponse.json({message: "Invalid Email or User Does Not Exist !", success: false}, {status: 400});
        }

        const verifyPass = await bcryptjs.compare(password, euser.password);
        if(!verifyPass){
            return NextResponse.json({message: "Invalid Password !", success: false}, {status: 401});
        }

        const td = { id: euser._id, username: euser.username, email: euser.email};
        const token = await jwt.sign(td, process.env.TOKEN_SECRET!, {expiresIn: "1d"},);
        const resp = NextResponse.json({message:"Login Successfull !", success: true},);

        resp.cookies.set("token", token, {httpOnly: true});
        return resp;

    } catch(error: any){
        return NextResponse.json({error: error.message, success: false }, {status: 500});
    }
}