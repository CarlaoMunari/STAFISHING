import { useEffect } from "react";
﻿import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { MobileBottomNav } from "./components/public/MobileBottomNav";
import { InstallPWA } from "./components/public/InstallPWA";

// Public Pages
import { HomePage } from "./pages/public/HomePage";
import { StagesPage } from "./pages/public/StagesPage";
import { RankingPage } from "./pages/public/RankingPage";
import { RegulationsPage } from "./pages/public/RegulationsPage";
import { TeamRegistration } from "./pages/public/TeamRegistration";
import { Checkout } from "./pages/public/Checkout";
import { GPSTracking } from "./pages/public/GPSTracking";
import { FishermanDashboard } from "./pages/public/FishermanDashboard";
import { CompanySelector } from "./pages/public/CompanySelector";
import { MultiCompanyRegistration } from "./pages/public/MultiCompanyRegistration";
import { LoginPage } from "./pages/LoginPage";

// Admin Pages
import { Dashboard } from "./pages/admin/Dashboard";
import { CarouselManagement } from "./pages/admin/CarouselManagement";
import { CircuitManagement } from "./pages/admin/CircuitManagement";
import { CircuitEditor } from "./pages/admin/CircuitEditor";
import { StageManagement } from "./pages/admin/StageManagement";
import { TeamManagement } from "./pages/admin/TeamManagement";
import { ScoreEntry } from "./pages/admin/ScoreEntry";
import { PaymentManagement } from "./pages/admin/PaymentManagement";
import { LocationTracking } from "./pages/admin/LocationTracking";
import { ImageManagement } from "./pages/admin/ImageManagement";
import { SponsorManagement } from "./pages/admin/SponsorManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { CompanySettings } from "./pages/admin/CompanySettings";
import { FirstAccessPasswordChange } from "./pages/admin/FirstAccessPasswordChange";
import { StageRankingPrint } from "./pages/admin/impressoes/StageRankingPrint";

function App() {
    useEffect(() => {
        document.title = "STA FISHING";
    }, []);

    return (
        <AuthProvider>
            <CompanyProvider>
                <Router basename={import.meta.env.BASE_URL}>
                    <ThemeProvider>
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

