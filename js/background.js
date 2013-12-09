function init() {
	
	intervalReady = setInterval(checkReady, 500); 
}

function beginCheckingComments(){
		getComments();
		var intervalID = window.setInterval(getComments, 5000); 
}

function checkReady() {
	if(localStorage.options) {
		if (!localStorage.comments) {
			localStorage.comments = "";
		}
	
		clearInterval(intervalReady);
		beginCheckingComments();
	}
}

var intervalReady,memberList;
memberList = {};
init();


function commentChecker(comments) {
	var commentID, allCommentIDs,text,username;
	allCommentIDs = "0";
    
	for (var i = 0, comment; comment = comments[i]; i++) {
		commentID   = comment.id + ":";
		allCommentIDs = localStorage.comments;
		author = memberList[comment.member_id] || memberList[0];
		username = author.user_name;
		avatar = 'https://app.liquidplanner.com' + author.avatar_url;
		task   = comment.treeitem;
		
		
		
		if(allCommentIDs.indexOf(commentID) != -1) {

		} else {
		
			// Create a simple text notification:
			var notification = webkitNotifications.createNotification(
				avatar,  // icon url - can be relative
			  username + ' posted: ',  // notification title
			  text = comment.plain_text.slice(0,100)

			  // notification body text
			);
			
			var myURL = route(LiquidPlanner.showTaskUrl, {task_id: comment.item_id})
			
			
			notification.onclick = function(event) {
				var args = { 
					url: myURL, 
					active : true 
				}; 
				event.currentTarget.cancel()
				
				chrome.tabs.create(args, null);
			}
			
			//notification.ondisplay = function(event) {
            //            setTimeout(function() {
            //                event.currentTarget.cancel();
            //            }, 10 * 1000);
            //        }
			
			notification.show();
			localStorage.comments = allCommentIDs + commentID;
		}
  }
  
}

// Stores the workspace members as a hash.  
// These are used to display the member's name in comments the comments section.
function storeMembers(members){
  for (var i = 0, member; member = members[i]; i++) {
    memberList[member.id] = member;
  }
}

function getComments(){
  if(LiquidPlanner.defaults.commentCount > 0){
      LiquidPlanner.members({
      timeout:  3500,
      success: function(members){
		storeMembers(members);
        LiquidPlanner.chatter({
          success:  commentChecker,
          data:{
            'ignore_mine': LiquidPlanner.defaults.ignoreMyComments,
            'for_me':      !LiquidPlanner.defaults.showAllComments,
            'limit':       LiquidPlanner.defaults.commentCount
        }});
      }
    });
	

	}
}