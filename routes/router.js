const express = require('express');
const router = express.Router();
const rootController = require('../controllers/rootController');
const projectController = require('../controllers/projectController')
const buildController = require('../controllers/buildController')
const analyticsController = require('../controllers/analyticsController');
const validateSubdomain = require('../middleware/authAnalytics');

router.get('/', rootController.root);
router.post('/new-project/:githubId', projectController.newProject);
router.post('/new-build/:githubId/:prname', buildController.newBuild);
router.post('/domainRegister', buildController.domainRegister);
router.post('/env', projectController.getEnv);
router.post('/update-env', projectController.updateEnv);
router.get('/domainValidation/:domain', buildController.domainValidation);
router.get('/getproject/:githubId/:prname', projectController.getProject);
router.get('/getproject/:githubId', projectController.getAllProject);
router.get('/getBuild/:githubId/:prname/:blname', buildController.getBuild);
router.get('/getBuild/:githubId/:prname', buildController.getAllBuild);
router.get('/test', (req, res)=>{res.send("testing")});
router.post('/analytics', validateSubdomain, analyticsController.getAnalytics);
// router.get('/get-analytics'); // on AWS server
// router.post('/upload-zip'); // on AWS server

module.exports = router;
