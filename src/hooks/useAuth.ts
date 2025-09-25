import {useContext} from "react";
import {AuthContext} from "../lib/AuthProvider.tsx";

export const useAuth = () => useContext(AuthContext);
