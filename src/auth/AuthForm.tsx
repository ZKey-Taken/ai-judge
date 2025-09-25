import {type FormEvent, useState} from "react";
import {supabase} from "../lib/Supabase.ts";
import {ConfirmationOverlay} from "../components/Overlay.tsx";
import "./AuthForm.css";

export function AuthForm() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) {
            setErrorMessage(error.message);
        } else {
            setSuccessMessage("Login successful!");
            // Clear form
            setEmail("");
            setPassword("");
        }

        setLoading(false);
    }

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        // Validate password confirmation
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            setLoading(false);
            return;
        }

        // Basic password validation
        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        const {error} = await supabase.auth.signUp({email, password});
        if (error) {
            setErrorMessage(error.message);
        } else {
            setSuccessMessage("Account created successfully! Please check your email for verification.");

            setEmail("");
            setPassword("");
            setConfirmPassword("");
        }

        setLoading(false);
    }

    const login = () => {
        return (
            <form className="login" onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        );
    }

    const signup = () => {
        return (
            <form className="signup" onSubmit={handleSignup}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>
        );
    }

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setErrorMessage("");
        setSuccessMessage("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
    }

    return (
        <div className="auth-form-div">
            <div className="auth-header">
                <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
            </div>

            {isLogin ? login() : signup()}

            <div className="auth-toggle">
                <p>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={toggleAuthMode}
                        className="toggle-link"
                        disabled={loading}
                    >
                        {isLogin ? "Sign up here" : "Login here"}
                    </button>
                </p>
            </div>

            {errorMessage &&
                <ConfirmationOverlay
                    title="Error"
                    message={errorMessage}
                    onConfirm={() => setErrorMessage("")}
                />
            }

            {successMessage &&
                <ConfirmationOverlay
                    title="Success"
                    message={successMessage}
                    onConfirm={() => setSuccessMessage("")}
                />
            }
        </div>
    )
}