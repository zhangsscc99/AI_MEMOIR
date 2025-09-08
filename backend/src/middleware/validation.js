const { body, validationResult } = require('express-validator');

/**
 * 处理验证错误的中间件
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: '请求数据验证失败',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

/**
 * 用户注册验证规则
 */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在 3-50 个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在 6-128 个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配');
      }
      return true;
    }),
    
  handleValidationErrors
];

/**
 * 用户登录验证规则
 */
const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('请输入用户名或邮箱'),
    
  body('password')
    .notEmpty()
    .withMessage('请输入密码'),
    
  handleValidationErrors
];

/**
 * 修改密码验证规则
 */
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
    
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('新密码长度必须在 6-128 个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含至少一个小写字母、一个大写字母和一个数字'),
    
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认新密码与新密码不匹配');
      }
      return true;
    }),
    
  handleValidationErrors
];

/**
 * 更新用户资料验证规则
 */
const validateUpdateProfile = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('昵称长度不能超过 100 个字符'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('请输入有效的手机号码'),
    
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('个人简介长度不能超过 500 个字符'),
    
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('地址长度不能超过 200 个字符'),
    
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male、female 或 other'),
    
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的日期格式'),
    
  handleValidationErrors
];

/**
 * 创建回忆录验证规则
 */
const validateCreateMemoir = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('回忆录标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('回忆录标题长度必须在 1-200 个字符之间'),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('回忆录描述长度不能超过 1000 个字符'),
    
  handleValidationErrors
];

/**
 * 创建日记验证规则
 */
const validateCreateDiary = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('日记标题不能为空')
    .isLength({ min: 1, max: 200 })
    .withMessage('日记标题长度必须在 1-200 个字符之间'),
    
  body('content')
    .optional()
    .trim(),
    
  body('mood')
    .optional()
    .isIn(['happy', 'sad', 'excited', 'calm', 'angry', 'confused', 'grateful', 'nostalgic'])
    .withMessage('请选择有效的心情'),
    
  body('diary_date')
    .optional()
    .isISO8601()
    .withMessage('请输入有效的日期格式'),
    
  body('is_private')
    .optional()
    .isBoolean()
    .withMessage('隐私设置必须是布尔值'),
    
  handleValidationErrors
];

/**
 * 回答问题验证规则
 */
const validateAnswer = [
  body('memoir_id')
    .notEmpty()
    .withMessage('回忆录 ID 不能为空')
    .isUUID()
    .withMessage('回忆录 ID 格式无效'),
    
  body('question_id')
    .notEmpty()
    .withMessage('问题 ID 不能为空')
    .isUUID()
    .withMessage('问题 ID 格式无效'),
    
  body('answer_text')
    .optional()
    .trim(),
    
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
  validateCreateMemoir,
  validateCreateDiary,
  validateAnswer
};
