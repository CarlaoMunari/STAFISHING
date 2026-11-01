import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

import { MobileBottomNav } from "./components/public/MobileBottomNav";
import { InstallPWA } from "./components/public/InstallPWA";

// HomePage is loaded eagerly for instant initial rendering
import { HomePage } from "./pages/public/HomePage";

// Public Pages (Lazy Loaded)
const StagesPage = lazy(() => import("./pages/public/StagesPage").then(m => ({ default: m.StagesPage })));
const RankingPage = lazy(() => import("./pages/public/RankingPage").then(m => ({ default: m.RankingPage })));
const RegulationsPage = lazy(() => import("./pages/public/RegulationsPage").then(m => ({ default: m.RegulationsPage })));
const TeamRegistration = lazy(() => import("./pages/public/TeamRegistration").then(m => ({ default: m.TeamRegistration })));
const Checkout = lazy(() => import("./pages/public/Checkout").then(m => ({ default: m.Checkout })));
const GPSTracking = lazy(() => import("./pages/public/GPSTracking").then(m => ({ default: m.GPSTracking })));
const FishermanDashboard = lazy(() => import("./pages/public/FishermanDashboard").then(m => ({ default: m.FishermanDashboard })));
const CompanySelector = lazy(() => import("./pages/public/CompanySelector").then(m => ({ default: m.CompanySelector })));
const MultiCompanyRegistration = lazy(() => import("./pages/public/MultiCompanyRegistration").then(m => ({ default: m.MultiCompanyRegistration })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));

// Admin Pages (Lazy Loaded)
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then(m => ({ default: m.Dashboard })));
const CarouselManagement = lazy(() => import("./pages/admin/CarouselManagement").then(m => ({ default: m.CarouselManagement })));
const CircuitManagement = lazy(() => import("./pages/admin/CircuitManagement").then(m => ({ default: m.CircuitManagement })));
const CircuitEditor = lazy(() => import("./pages/admin/CircuitEditor").then(m => ({ default: m.CircuitEditor })));
const StageManagement = lazy(() => import("./pages/admin/StageManagement").then(m => ({ default: m.StageManagement })));
const TeamManagement = lazy(() => import("./pages/admin/TeamManagement").then(m => ({ default: m.TeamManagement })));
const ScoreEntry = lazy(() => import("./pages/admin/ScoreEntry").then(m => ({ default: m.ScoreEntry })));
const PaymentManagement = lazy(() => import("./pages/admin/PaymentManagement").then(m => ({ default: m.PaymentManagement })));
const LocationTracking = lazy(() => import("./pages/admin/LocationTracking").then(m => ({ default: m.LocationTracking })));
const ImageManagement = lazy(() => import("./pages/admin/ImageManagement").then(m => ({ default: m.ImageManagement })));
const SponsorManagement = lazy(() => import("./pages/admin/SponsorManagement").then(m => ({ default: m.SponsorManagement })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const CompanySettings = lazy(() => import("./pages/admin/CompanySettings").then(m => ({ default: m.CompanySettings })));
const FirstAccessPasswordChange = lazy(() => import("./pages/admin/FirstAccessPasswordChange").then(m => ({ default: m.FirstAccessPasswordChange })));
const StageRankingPrint = lazy(() => import("./pages/admin/impressoes/StageRankingPrint").then(m => ({ default: m.StageRankingPrint })));

function App() {
    useEffect(() => {
        document.title = "STA FISHING";
    }, []);

    return (
        <AuthProvider>
            <CompanyProvider>
                <Router basename={import.meta.env.BASE_URL}>
                    <ThemeProvider>
                        <Suspense fallback={
                            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                <LoadingSpinner size="lg" />
                            </div>
                        }>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<HomePage />} />
                            <Route path="/empresas" element={<CompanySelector />} />
                            <Route path="/inscricao" element={<MultiCompanyRegistration />} />
                            <Route path="/gps" element={<GPSTracking />} />
                            <Route path="/pescador" element={<FishermanDashboard />} />
                            <Route path="/login" element={<LoginPage />} />

                            {/* Admin Routes - Protected */}
                            <Route
                                path="/admin/change-password"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company", "judge", "captain"]}>
                                        <FirstAccessPasswordChange />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/carousel"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <CarouselManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/circuits"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <CircuitManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/circuits/new"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <CircuitEditor />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/circuits/editar/:id"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <CircuitEditor />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/stages"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <StageManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/teams"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <TeamManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/scores"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "judge", "company"]}>
                                        <ScoreEntry />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/payments"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <PaymentManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/location"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <LocationTracking />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/images"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <ImageManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/sponsors"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <SponsorManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/users"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin"]}>
                                        <UserManagement />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/settings"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "company"]}>
                                        <CompanySettings />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin/impressoes/classificacao"
                                element={
                                    <ProtectedRoute allowedRoles={["super_admin", "judge", "company"]}>
                                        <StageRankingPrint />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Company-specific routes */}
                            <Route path="/:companyName" element={<HomePage />} />
                            <Route path="/:companyName/etapas" element={<StagesPage />} />
                            <Route path="/:companyName/ranking" element={<RankingPage />} />
                            <Route path="/:companyName/regulamento" element={<RegulationsPage />} />
                            <Route path="/:companyName/register/:stageId" element={<TeamRegistration />} />
                            <Route path="/:companyName/checkout" element={<Checkout />} />

                            {/* Global routes */}
                            <Route path="/etapas" element={<StagesPage />} />
                            <Route path="/ranking" element={<RankingPage />} />
                            <Route path="/regulamento" element={<RegulationsPage />} />
                            <Route path="/register/:stageId" element={<TeamRegistration />} />
                            <Route path="/checkout" element={<Checkout />} />

                            {/* Catch all - redirect to home */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        </Suspense>

                        {/* Mobile Bottom Navigation */}
                        <MobileBottomNav />
                        <InstallPWA />
                    </ThemeProvider>
                </Router>
            </CompanyProvider>
        </AuthProvider>
    );
}

export default App;

