const { matchedData } = require('express-validator');
const Employee = require('../models/Employee');
const logger = require('../config/logger');

async function createEmployee(req, res, next) {
    try {
        const data = matchedData(req, { locations: ['body'] });

        const employee = await Employee.create({
            ...data,
            user: req.user._id
        });

        logger.info('Employee created', {
            userId: req.user._id.toString(),
            employeeId: employee._id.toString()
        });

        return res.status(201).json({
            status: 'success',
            employee
        });
    } catch (error) {
        next(error);
    }
}

async function getEmployees(req, res, next) {
    try {
        const employees = await Employee.find({
            user: req.user._id
        }).sort({ created_at: -1 });

        logger.info('Employees listed', {
            userId: req.user._id.toString(),
            count: employees.length
        });

        return res.status(200).json({
            status: 'success',
            employees
        });
    } catch (error) {
        next(error);
    }
}
async function getOwnedEmployee(req, res) {
    const employee = await Employee.findById(req.params.eid);

    if (!employee) {
        res.status(404).json({
            status: 'error',
            message: 'Employee not found'
        });
        return null;
    }

    if (!employee.user.equals(req.user._id)) {
        logger.warn('Employee access denied', {
            userId: req.user._id.toString(),
            employeeId: employee._id.toString(),
            method: req.method
        });
        res.status(403).json({
            status: 'error',
            message: 'Access denied'
        });
        return null;
    }

    return employee;
}

async function getEmployee(req, res, next) {
    try {
        const employee = await getOwnedEmployee(req, res);
        if (!employee) return;
        logger.info('Employee retrieved', {
            userId: req.user._id.toString(),
            employeeId: employee._id.toString()
        });

        return res.status(200).json({
            status: 'success',
            employee
        });
    } catch (error) {
        next(error);
    }
}

async function updateEmployee(req, res, next) {
    try {
        const employee = await getOwnedEmployee(req, res);
        if (!employee) return;

        const data = matchedData(req, { locations: ['body'] });
        employee.set(data);
        await employee.save();
        logger.info('Employee updated', {
            userId: req.user._id.toString(),
            employeeId: employee._id.toString()
        });

        return res.status(200).json({
            status: 'success',
            employee
        });
    } catch (error) {
        next(error);
    }
}

async function deleteEmployee(req, res, next) {
    try {
        const employee = await Employee.findById(req.query.eid);

        if (!employee) {
            return res.status(404).json({
                status: 'error',
                message: 'Employee not found'
            });
        }

        if (!employee.user.equals(req.user._id)) {
            logger.warn('Employee access denied', {
                userId: req.user._id.toString(),
                employeeId: employee._id.toString(),
                method: req.method
            });
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        await Employee.deleteOne({
            _id: employee._id,
            user: req.user._id
        });
        logger.info('Employee deleted', {
            userId: req.user._id.toString(),
            employeeId: employee._id.toString()
        });

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEmployee,
    getEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee
};