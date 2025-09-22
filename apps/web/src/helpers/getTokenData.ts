import { NextRequest, NextResponse } from "next/server";
import Jwt from "jsonwebtoken";

export const getTokenData = (request: NextRequest)=> {
    try {
        const encToken = request.cookies.get('token') ?.value || '';
        const decToken = Jwt.verify(encToken, process.env.TOKEN_SECRET!);
        return decToken;
    } catch (error: any) {
        throw error.message;
    }
}
