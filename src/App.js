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
import Tasks from './components/Tasks';
import Company from './components/Company';
import UserList from './components/UserList';
import Profile from './components/Profile';
import UserDetails from './components/UserDetails';
import CreateCompany from './components/CreateCompany';
import AddEmployee from './components/AddEmployee';
import CreateRole from './components/CreateRole';
import ManageRoles from './components/ManageRoles';
import Notifications from './components/Notifications';
import CompanySettingsPage from './components/CompanySettingsPage';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import HolidayCalendar from './components/HolidayCalendar';
import LeaveManagement from './components/LeaveManagement';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <CompanyProvider>
            <ProjectProvider>
              <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
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
                <Route path="/projects/:id/tasks" element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                } />
                <Route path="/overview" element={
                  <ProtectedRoute>
                    <Company />
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
                </Routes>
              </Router>
            </ProjectProvider>
          </CompanyProvider>
        </UserProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
