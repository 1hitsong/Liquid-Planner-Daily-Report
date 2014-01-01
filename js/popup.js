//Show the LP Tree data on the page
function loadTime(obj){
	for (var i = 0, entry; entry = obj[i]; i++) {
		$('li[data-id="' + entry.item_id + '"]').attr("data-todayActivity","true");
	}
}

//Show the LP Tree data on the page
function loadTree(obj){
	var fragments = [];
	var element = "";
	var percentComplete,estCompleteDate,today;

	function recurse(item){
		fragments.push('<ul>'); // start a new <ul>
		
		$.each(item.children, function(key, val) {
			if(val.type!="Inbox" && val.type!="Event" && val.name!="Events"){
				percentComplete = Math.round((val.work/(val.work + val.high_effort_remaining))*100);
				
				estCompleteDate = val.p98_finish;
				today =new Date(estCompleteDate);
				estCompleteDate = (today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();
				estCompleteDate = estCompleteDate.match(/[^T]*/);
				element = '<li data-id="' + val.id + '" data-type="' + val.type + '" data-is_done="' + val.is_done + '" data-owner_id="' + val.owner_id + '">' + val.name;
				if(val.is_done == false){
					if(val.type == 'Project'){
						element = element + ' (' + percentComplete + '% Complete) EST Completion Date: ' + estCompleteDate;
					}
				} else {
					element = element + ' (Completed Today)';
				}
				
				fragments.push(element);
				if(typeof val.children == 'object'){
						recurse(val);
				} else {
					fragments.push('</li>');
				}
			}
		});
		
		fragments.push('</ul>'); // close </ul>
	}

	recurse(obj);
	$("body").append( fragments.join('') );    // return results
	
	$('#filterDesign').click(function(){
		$('li').hide();
		$('li[data-type="Project"][data-owner_id="253809"]').each(function(){
			$(this).find('li[data-type="Task"][data-todayActivity="true"]').show().parents().show();
		});
		
		return false;
	});
	$('#filterProgramming').click(function(){
		$('li').hide();
		$('li[data-type="Project"][data-owner_id="253964"]').each(function(){
			$(this).find('li[data-type="Task"][data-todayActivity="true"]').show().parents().show();
		});
		
		return false;
	});
	$('#filterEmail').click(function(){
		$('li').hide();
		$('li[data-type="Project"][data-owner_id="256113"]').each(function(){
			$(this).find('li[data-type="Task"][data-todayActivity="true"]').show().parents().show();
		});
		
		return false;
	});

}

function formatDisplay(){
	$('li').hide();
	$('#loading').hide();
	$('li[data-todayActivity="true"]').show().parents().show();
	$('#filter').fadeIn();
}

// Stores the workspace members as a hash.  
// These are used to display the member's name in comments the comments section.
function storeMembers(members){
  LiquidPlanner.members = {};
  for (var i = 0, member; member = members[i]; i++) {
    LiquidPlanner.members[member.id] = member;
  }
}

// If the user has not yet picked a defualt space, we show this message.
function showConfigureRequest(){
  $('#message').html( 
    $('<a>',
      {
        'class': 'menu_item',
        'href': 'options.html',
        'target': '_liquid_planner'
      }).text('Please configure LiquidPlanner')
  ).fadeIn('fast');
}

// If the user does not currently have a session or HTTP Basic Auth credentials, then we direct them to
// LiquidPlanner.
function showLoginRequest(){
  $('#message').html( 
    $('<a>',
      {
        'class': 'menu_item',
        'href': route(':host'),
        'target': '_liquid_planner'
      }).text('Please log into LiquidPlanner')
  ).fadeIn('fast');
}

$(document).ready(function(){

	$('#showYesterday').click(function(){
	 	$("body ul").remove();

	 	var d1=$('input#date').val();

	 	LiquidPlanner.newTimesheet = resource(':host/:api_path/workspaces/:space_id/timesheet_entries?start_date=' + d1 + '&amp;end_date=' + d1);

		LiquidPlanner.treeitems({
		  success: function(items){
			loadTree(items);
			LiquidPlanner.newTimesheet({
			  success:  function(timeitems){
				loadTime(timeitems);
				formatDisplay();
			  }
			});
		  }
		});

	  return false;
	});
	
  // Register a global Ajax error handler.
  // If Chrome receives a 401 response, it will not display the standard
  // HTTP Basic Auth dialog.  Instead it will just sit here.  
  // If so, direct the user to log into LiquidPlanner.
  $('#error')
    .ajaxError(
      function(event, request, settings){
        console.log('error', event, request, settings);
        var authIssue = (request.readyState == 0 || request.readyState == 1) && settings.timeout;
        if( authIssue ){
          showLoginRequest();
        } else {
          $(this).html("Could not load LiquidPlanner data").fadeIn('fast');
        }
      }
    );
  
  if(!LiquidPlanner.isConfigured()){
    showConfigureRequest();
    return;
  }
	if(LiquidPlanner.defaults.commentCount > 0){
		  LiquidPlanner.members({
		  timeout:  3500,
		  success: function(members){
			storeMembers(members);
		  }
		});
	}

	 if(LiquidPlanner.defaults.commentCount > 0){
		LiquidPlanner.treeitems({
		  success: function(treeitems){
			loadTree(treeitems);
			LiquidPlanner.timesheets({
			  success:  function(treeitems){
				loadTime(treeitems);
				formatDisplay();
			  }
			});
		  }
		});
	  }

	  $('input#date').Zebra_DatePicker();
});
