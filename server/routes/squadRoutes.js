const express = require('express');
const router = express.Router();
const squadController = require('../controllers/squadController');
const { protect } = require('../middleware/authMiddleware');
const { inviteToSquad, acceptSquadInvite, declineSquadInvite, checkSquadInvite, getUserSquadInvites } = require('../controllers/squadController');

router.get('/invites', protect, getUserSquadInvites);
router.post('/:id/invite', protect, inviteToSquad);

router.patch('/invite/:inviteId/accept', protect, acceptSquadInvite);
router.patch('/invite/:inviteId/decline', protect, declineSquadInvite);

router.get('/', squadController.getAllSquads);
router.get('/:id', squadController.getSquadById);
router.post('/', protect, squadController.createSquad);
router.put('/:id/join', protect, squadController.joinSquad);
router.put('/:id/leave', protect, squadController.leaveSquad);
router.post('/:id/leave', protect, squadController.leaveSquad);
router.delete('/:id', protect, squadController.deleteSquad);
router.patch('/:id', protect, squadController.updateSquad);
router.post('/:id/join-request', protect, squadController.createJoinRequest);
router.delete('/:id/join-request', protect, squadController.cancelJoinRequest);
router.get('/:id/join-requests', protect, squadController.getJoinRequests);
router.get('/:id/join-request-status', protect, squadController.getUserJoinRequestStatus);
router.get('/:id/history', protect, squadController.getSquadHistory);
router.get('/:id/warnings', squadController.getSquadWarningsPublic);
router.post('/join-request/:requestId/handle', protect, squadController.handleJoinRequest);

// Новые маршруты для управления участниками
router.post('/:squadId/members/:userId/promote', protect, squadController.promoteMember);
router.post('/:squadId/members/:userId/demote', protect, squadController.demoteMember);
router.post('/:squadId/members/:userId/kick', protect, squadController.kickMember);


router.get('/:squadId/invite/check/:userId', protect, checkSquadInvite);


module.exports = router;