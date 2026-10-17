const express = require('express');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');

const {
    createEmployee,
    getEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');

const {
    employeeValidation,
    employeeIdValidation,
    deleteEmployeeValidation
} = require('../validators/employeeValidators');

const router = express.Router();

router.use(authenticate);

router.get('/employees', getEmployees);

router.post(
    '/employees',
    employeeValidation,
    validateRequest,
    createEmployee
);

router.get(
    '/employees/:eid',
    employeeIdValidation,
    validateRequest,
    getEmployee
);

router.put(
    '/employees/:eid',
    employeeIdValidation,
    employeeValidation,
    validateRequest,
    updateEmployee
);

router.delete(
    '/employees',
    deleteEmployeeValidation,
    validateRequest,
    deleteEmployee
);

module.exports = router;