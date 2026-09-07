import LoginCard from "../components/auth/LoginCard";
import SystemStatus from "../components/auth/SystemStatus";
import BackgroundEffects from "../components/auth/BackgroundEffects";
import LiveClock from "../components/auth/LiveClock";

function Login() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070B14]">

      {/* Animated Background */}
      <BackgroundEffects />

      {/* Live Clock */}
      <div className="absolute top-6 right-8 z-30">
        <LiveClock />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex min-h-screen items-center justify-center px-10">

        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Panel */}
          <SystemStatus />

          {/* Right Panel */}
          <LoginCard />

        </div>

      </div>

    </div>
  );
}

export default Login;