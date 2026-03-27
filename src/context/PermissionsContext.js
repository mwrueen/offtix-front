import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import { getCookie } from '../utils/cookies';

const PermissionsContext = createContext();

/**
 * All available permission keys in the system.
 * Keep in sync with the Company model's designations.permissions schema.
 */
export const PERMISSIONS = {
    // Employee Management
    ADD_EMPLOYEE: 'addEmployee',
    VIEW_EMPLOYEE_LIST: 'viewEmployeeList',
    EDIT_EMPLOYEE: 'editEmployee',

    // Role & Designation Management
    CREATE_DESIGNATION: 'createDesignation',
    VIEW_DESIGNATIONS: 'viewDesignations',
    EDIT_DESIGNATION: 'editDesignation',
    DELETE_DESIGNATION: 'deleteDesignation',

    // Project Management
    CREATE_PROJECT: 'createProject',
    EDIT_PROJECT: 'editProject',
    DELETE_PROJECT: 'deleteProject',
    ASSIGN_EMPLOYEE_TO_PROJECT: 'assignEmployeeToProject',
    REMOVE_EMPLOYEE_FROM_PROJECT: 'removeEmployeeFromProject',
    VIEW_PROJECT_ANALYTICS: 'viewProjectAnalytics',

    // Task Management
    CREATE_TASK: 'createTask',
    EDIT_TASK: 'editTask',
    DELETE_TASK: 'deleteTask',

    // Company Settings
    MANAGE_COMPANY_SETTINGS: 'manageCompanySettings',
    MANAGE_RECRUITMENT: 'manageRecruitment',
};

/**
 * All permissions enabled (for owners/superadmins).
 */
const ALL_PERMISSIONS = {
    addEmployee: true,
    viewEmployeeList: true,
    editEmployee: true,
    createDesignation: true,
    viewDesignations: true,
    editDesignation: true,
    deleteDesignation: true,
    createProject: true,
    editProject: true,
    deleteProject: true,
    assignEmployeeToProject: true,
    removeEmployeeFromProject: true,
    viewProjectAnalytics: true,
    createTask: true,
    editTask: true,
    deleteTask: true,
    manageCompanySettings: true,
    manageRecruitment: true,
};

/**
 * Default (no) permissions.
 */
const NO_PERMISSIONS = {
    addEmployee: false,
    viewEmployeeList: false,
    editEmployee: false,
    createDesignation: false,
    viewDesignations: false,
    editDesignation: false,
    deleteDesignation: false,
    createProject: false,
    editProject: false,
    deleteProject: false,
    assignEmployeeToProject: false,
    removeEmployeeFromProject: false,
    viewProjectAnalytics: false,
    createTask: false,
    editTask: false,
    deleteTask: false,
    manageCompanySettings: false,
    manageRecruitment: false,
};

export const PermissionsProvider = ({ children }) => {
    const { state: authState } = useAuth();
    const { state: companyState } = useCompany();

    const [permissions, setPermissions] = useState(NO_PERMISSIONS);
    const [isOwner, setIsOwner] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchPermissions = useCallback(async () => {
        const selectedCompany = companyState.selectedCompany;

        // Personal mode or no company: no company permissions
        if (!selectedCompany || selectedCompany.id === 'personal' || !authState.user) {
            setPermissions(NO_PERMISSIONS);
            setIsOwner(false);
            setIsSuperAdmin(authState.user?.role === 'superadmin');
            setCompanyData(null);
            return;
        }

        const isSA = authState.user?.role === 'superadmin';
        setIsSuperAdmin(isSA);

        // Superadmin gets all permissions without fetching
        if (isSA) {
            setPermissions(ALL_PERMISSIONS);
            setIsOwner(false);
            return;
        }

        // Check if permissions are embedded in the selected company object (from getUserCompanies)
        if (selectedCompany.userPermissions) {
            const userId = authState.user?._id || authState.user?.id;
            const ownerFlag = selectedCompany.isOwner || selectedCompany.userRole === 'owner';
            setIsOwner(ownerFlag);
            setPermissions(ownerFlag ? ALL_PERMISSIONS : {
                ...NO_PERMISSIONS,
                ...selectedCompany.userPermissions
            });
            return;
        }

        // Fallback: fetch company data to resolve permissions
        setLoading(true);
        try {
            const token = getCookie('authToken');
            const response = await fetch(`/api/companies/${selectedCompany.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                setPermissions(NO_PERMISSIONS);
                return;
            }

            const company = await response.json();
            setCompanyData(company);

            const userId = authState.user?._id || authState.user?.id;
            const ownerId = company.owner?._id || company.owner;
            const ownerFlag = ownerId?.toString() === userId?.toString();
            setIsOwner(ownerFlag);

            if (ownerFlag) {
                setPermissions(ALL_PERMISSIONS);
                return;
            }

            // Find member's designation and resolve permissions
            const memberInfo = company.members?.find(m => {
                const memberId = m.user?._id || m.user;
                return memberId?.toString() === userId?.toString();
            });

            if (memberInfo) {
                const designation = company.designations?.find(d => d.name === memberInfo.designation);
                if (designation?.permissions) {
                    setPermissions({
                        ...NO_PERMISSIONS,
                        ...designation.permissions,
                    });
                } else {
                    // Default non-privileged member permissions
                    setPermissions({
                        ...NO_PERMISSIONS,
                        viewEmployeeList: true,
                        viewDesignations: true,
                    });
                }
            } else {
                setPermissions(NO_PERMISSIONS);
            }
        } catch (error) {
            console.error('PermissionsContext: Error fetching permissions:', error);
            setPermissions(NO_PERMISSIONS);
        } finally {
            setLoading(false);
        }
    }, [companyState.selectedCompany, authState.user]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    /**
     * Check if user has a specific permission.
     * @param {string} permissionKey - key from PERMISSIONS constant
     * @returns {boolean}
     */
    const hasPermission = useCallback((permissionKey) => {
        if (isSuperAdmin) return true;
        if (isOwner) return true;
        return permissions[permissionKey] === true;
    }, [permissions, isOwner, isSuperAdmin]);

    /**
     * Check if user has ALL listed permissions.
     * @param {string[]} permissionKeys
     * @returns {boolean}
     */
    const hasAllPermissions = useCallback((permissionKeys) => {
        return permissionKeys.every(key => hasPermission(key));
    }, [hasPermission]);

    /**
     * Check if user has ANY of the listed permissions.
     * @param {string[]} permissionKeys
     * @returns {boolean}
     */
    const hasAnyPermission = useCallback((permissionKeys) => {
        return permissionKeys.some(key => hasPermission(key));
    }, [hasPermission]);

    const value = {
        permissions,
        isOwner,
        isSuperAdmin,
        companyData,
        loading,
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        refetchPermissions: fetchPermissions,
        PERMISSIONS,
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
};
