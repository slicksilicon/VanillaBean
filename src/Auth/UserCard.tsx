import { useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import Button from "../Components/Button/Button";
import { ICON_SVG_GOOGLE } from "../assets/svg_icons/google.ts";
import "./UserCard.css";

/*
 * The signed-in user in the top row - EscapeVelocity's user icon and hover card (styled by App.css), plus a sign-out
 * button. Rendered only when Google sign-in is enabled.
 */
const UserCard: React.FC = () => {
    const { user, logout } = useAuth();
    const [showUserCard, setShowUserCard] = useState(false);

    return (
        <div
            className="user-icon-wrapper user-icon-wrapper-solo"
            onMouseEnter={() => setShowUserCard(true)}
            onMouseLeave={() => setShowUserCard(false)}
        >
            <button className="user-icon-button" title="User Info">
                <span className="user-icon" dangerouslySetInnerHTML={{ __html: ICON_SVG_GOOGLE }}></span>
            </button>
            {showUserCard && user && (
                <div className="user-card">
                    {user.picture_url && <img className="user-card-avatar" src={user.picture_url} alt={user.name} />}
                    <div className="user-card-info">
                        <span className="user-card-name">{user.name}</span>
                        <span className="user-card-email">{user.email}</span>
                        <Button variant="secondary" size="small" onClick={() => void logout()} className="user-card-signout">
                            Sign out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserCard;
