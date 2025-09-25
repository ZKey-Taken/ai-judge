import {createContext, type ReactNode, useEffect, useState} from "react"
import {supabase} from "./Supabase.ts"
import type {User} from "@supabase/supabase-js"

type AuthContextType = {
    user: User | null;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null, logout: async () => {
    }
});

function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({data}) => setUser(data.user ?? null))

        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        })

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{user, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export {AuthContext, AuthProvider};