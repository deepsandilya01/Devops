import { body, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next({ status: 400, message: errors.array() });
  }

  next();
};

/**
 * REGISTER VALIDATION
 */
export const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("contact")
    .optional()
    .isNumeric()
    .withMessage("Contact must be a number")
    .isLength({ min: 10, max: 10 })
    .withMessage("Contact must be 10 digits"),

  validate,
];

/**
 * LOGIN VALIDATION
 */
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password").notEmpty().withMessage("Password is required"),

  validate,
];

/**
 * UPDATE PROFILE VALIDATION
 */
export const updateProfileValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),

  body("contact")
    .optional()
    .isNumeric()
    .withMessage("Contact must be a number")
    .isLength({ min: 10, max: 10 })
    .withMessage("Contact must be 10 digits"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  validate,
];
