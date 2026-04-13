import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { CompanyProvider } from './context/CompanyContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import Company from './components/Company';
import UserList from './components/UserList';
import Profile from './components/Profile';
import ProfilePreview from './components/ProfilePreview';
import UserDetails from './components/UserDetails';
import CreateCompany from './components/CreateCompany';
import AddEmployee from './components/AddEmployee';
import InvitationDetails from './components/InvitationDetails';
import CreateRole from './components/CreateRole';
import ManageRoles from './components/ManageRoles';
import Notifications from './components/Notifications';
import CompanySettingsPage from './components/CompanySettingsPage';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import HolidayCalendar from './components/HolidayCalendar';
import LeaveManagement from './components/LeaveManagement';
import Workforce from './components/company/Workforce';
import Organogram from './components/Organogram';
import EditCompanyInfo from './components/EditCompanyInfo';
import CompanyList from './components/CompanyList';
import CompanyDetails from './components/CompanyDetails';
import MyTasksList from './components/MyTasksList';
import MyTaskDetails from './components/MyTaskDetails';
import TeamActivity from './components/TeamActivity';
import { SocketProvider } from './context/SocketContext';
import RealTimeNotifications from './components/RealTimeNotifications';
import { PermissionsProvider } from './context/PermissionsContext';
import { ChatProvider, useChat } from './context/ChatContext';
import GlobalChat from './components/chat/GlobalChat';
import RecruitmentOverview from './components/Recruitment/RecruitmentOverview';
import CreateCircular from './components/Recruitment/CreateCircular';
import ApplicantsList from './components/Recruitment/ApplicantsList';
import PublicCareers from './components/Recruitment/PublicCareers';
import JobDetails from './components/Recruitment/JobDetails';
import EditCircular from './components/Recruitment/EditCircular';
import JobOfferAccept from './components/Recruitment/JobOfferAccept';

function GlobalChatPortal() {
  const { isGlobalChatOpen, closeGlobalChat } = useChat();
  if (!isGlobalChatOpen) return null;
  return <GlobalChat onClose={closeGlobalChat} />;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <CompanyProvider>
            <ChatProvider>
              <PermissionsProvider>
                <ProjectProvider>
                  <Router>
                    <SocketProvider>
                      <RealTimeNotifications />
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/careers" element={<PublicCareers />} />
                        <Route path="/careers/:id" element={<JobDetails />} />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/projects" element={
                          <ProtectedRoute>
                            <Projects />
                          </ProtectedRoute>
                        } />
                        <Route path="/projects/:id" element={
                          <ProtectedRoute>
                            <ProjectDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/overview" element={
                          <ProtectedRoute>
                            <Company />
                          </ProtectedRoute>
                        } />
                        <Route path="/edit-company-info" element={
                          <ProtectedRoute>
                            <EditCompanyInfo />
                          </ProtectedRoute>
                        } />
                        <Route path="/users" element={
                          <ProtectedRoute>
                            <UserList />
                          </ProtectedRoute>
                        } />
                        <Route path="/users/:id" element={
                          <ProtectedRoute>
                            <UserDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile/view/:id" element={
                          <ProtectedRoute>
                            <ProfilePreview />
                          </ProtectedRoute>
                        } />
                        <Route path="/create-company" element={
                          <ProtectedRoute>
                            <CreateCompany />
                          </ProtectedRoute>
                        } />
                        <Route path="/add-employee" element={
                          <ProtectedRoute>
                            <AddEmployee />
                          </ProtectedRoute>
                        } />
                        <Route path="/create-role" element={
                          <ProtectedRoute>
                            <CreateRole />
                          </ProtectedRoute>
                        } />
                        <Route path="/manage-roles" element={
                          <ProtectedRoute>
                            <ManageRoles />
                          </ProtectedRoute>
                        } />
                        <Route path="/notifications" element={
                          <ProtectedRoute>
                            <Notifications />
                          </ProtectedRoute>
                        } />
                        <Route path="/invitations/:id" element={
                          <ProtectedRoute>
                            <InvitationDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/company-settings" element={
                          <ProtectedRoute>
                            <CompanySettingsPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/employees" element={
                          <ProtectedRoute>
                            <EmployeeList />
                          </ProtectedRoute>
                        } />
                        <Route path="/employees/:id" element={
                          <ProtectedRoute>
                            <EmployeeDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/holidays" element={
                          <ProtectedRoute>
                            <HolidayCalendar />
                          </ProtectedRoute>
                        } />
                        <Route path="/leaves" element={
                          <ProtectedRoute>
                            <LeaveManagement />
                          </ProtectedRoute>
                        } />
                        <Route path="/workforce" element={
                          <ProtectedRoute>
                            <Workforce />
                          </ProtectedRoute>
                        } />
                        <Route path="/organogram" element={
                          <ProtectedRoute>
                            <Organogram />
                          </ProtectedRoute>
                        } />
                        <Route path="/companies" element={
                          <ProtectedRoute>
                            <CompanyList />
                          </ProtectedRoute>
                        } />
                        <Route path="/companies/:id" element={
                          <ProtectedRoute>
                            <CompanyDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-tasks" element={
                          <ProtectedRoute>
                            <MyTasksList />
                          </ProtectedRoute>
                        } />
                        <Route path="/my-tasks/:id" element={
                          <ProtectedRoute>
                            <MyTaskDetails />
                          </ProtectedRoute>
                        } />
                        <Route path="/team-activity" element={
                          <ProtectedRoute>
                            <TeamActivity />
                          </ProtectedRoute>
                        } />
                        <Route path="/recruitment" element={
                          <ProtectedRoute>
                            <RecruitmentOverview />
                          </ProtectedRoute>
                        } />
                        <Route path="/recruitment/create" element={
                          <ProtectedRoute>
                            <CreateCircular />
                          </ProtectedRoute>
                        } />
                        <Route path="/recruitment/circulars/:id/applicants" element={
                          <ProtectedRoute>
                            <ApplicantsList />
                          </ProtectedRoute>
                        } />
                        <Route path="/recruitment/circulars/:id/edit" element={
                          <ProtectedRoute>
                            <EditCircular />
                          </ProtectedRoute>
                        } />
                        <Route path="/recruitment/offer/:applicationId" element={
                          <ProtectedRoute>
                            <JobOfferAccept />
                          </ProtectedRoute>
                        } />
                      </Routes>
                      <GlobalChatPortal />
                    </SocketProvider>
                  </Router>
                </ProjectProvider>
              </PermissionsProvider>
            </ChatProvider>
          </CompanyProvider>
        </UserProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
