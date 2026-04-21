import React from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/images/SEASIDE.png";
import "./HomePage.css";
import { WELCOME_ADDRESS } from "../config/constants";

const HomePage = () => {
  const navigate = useNavigate();

  const handleProceed = () => {
    // Always go to login screen – no skipping, no token check here
    console.log("Proceed clicked → redirecting to login");
    navigate("/login", { replace: true });
  };

  console.log("HomePage component rendered – no auto-login");

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap"
        rel="stylesheet"
      />

      <div
        className="home-container"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div className="hotel-name-banner">{WELCOME_ADDRESS}</div>

        <div className="home-card">
          <div className="hems-text">
            <span className="hems-letter">SH</span>
            <span className="hems-letter">op</span>
            <span className="hems-letter">M</span>
            <span className="hems-letter">an</span>
          </div>

          <button
            className="proceed-button"
            onClick={handleProceed}
            type="button"
          >
            Proceed &gt;&gt;
          </button>
        </div>

        <footer className="home-footer">
          <div>Produced & Licensed by School of Accounting Package</div>
          <div>© 2025</div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;