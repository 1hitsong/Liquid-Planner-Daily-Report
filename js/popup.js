// Show the LP Tree data on the page
function loadTree(obj){
    var fragments = [];
    var element = "";
    var percentComplete,estCompleteDate,today;
    var itemassignments = [];

    function recurse(item){

        fragments.push('<ul>');
        
        $.each(item.children, function(key, val) {
            if(val.type!="Inbox" && val.type!="Event" && val.name!="Events"){

                itemassignments = [];

                // Calculate % Complete
                percentComplete = Math.round((val.work/(val.work + val.high_effort_remaining))*100);
                
                // Calculate & Format estimated completion date
                estCompleteDate = val.p98_finish;
                today =new Date(estCompleteDate);
                estCompleteDate = (today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();
                estCompleteDate = estCompleteDate.match(/[^T]*/);

                $.each(val.assignments, function(key2, val2) {
                   itemassignments.push(val2.person_id);
                });



                element = '<li data-id="' + val.id + '" data-type="' + val.type + '" data-owner_id="' + itemassignments.join() + '">' + val.name;
                
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
        
        fragments.push('</ul>');
    }

    // If we have project data, show it, otherwise display no activity message
    if(Object.keys(obj).length){
        recurse(obj);
        $("body").append( fragments.join('') );    // Append project data
    } else {
        $("body").append( "<p>No activity found on the selected date.</p>" );
    }
    
    // Filter button handler
    $('.filter').click(function(){
        if( $(this).attr('rel') == "all" ) {
            $('li').show();
        } else {
            $('li').hide();
            $('li[data-type="Project"][data-owner_id*="' + $(this).attr('rel') + '"]').each(function(){
                $(this).find('li[data-type="Task"]').show().parents().show();
            });
        }
        
        return false;
    });

}

function formatDisplay(){
    $('#loading').hide();
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
    
    // Register a global Ajax error handler.
    // If Chrome receives a 401 response, it will not display the standard
    // HTTP Basic Auth dialog.  Instead it will just sit here.  
    // If so, direct the user to log into LiquidPlanner.
    $('#error').ajaxError(
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

        LiquidPlanner.treeitems({
            success: function(treeitems){
                var date = new Date(),
                today = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear().toString().substr(2,2);
                $("body").append( "<h1>Activity Report for " + today + "</h1>" );

                loadTree(treeitems);
                formatDisplay();
            }
        });
    }

    $('input#date').Zebra_DatePicker({
        onSelect: function(view, elements) {
            $("body ul").remove();

            var selectedDate=$('input#date').val();

            var mdy = selectedDate.split('-');
            
            var backOneDay = new Date(mdy[0], mdy[1]-1, mdy[2]),
                aheadOneDay = new Date(mdy[0], mdy[1]-1, mdy[2]),
                displayDate = mdy[1] + "/" + mdy[2] + "/" + mdy[0];

            $("body h1").html( "Activity Report for " + displayDate );

            backOneDay.setDate(backOneDay.getDate() - 1);
            aheadOneDay.setDate(aheadOneDay.getDate() + 1);

            backOneDay="" + backOneDay.getFullYear() + '-' + (backOneDay.getMonth()+1) + '-' + backOneDay.getDate();
            aheadOneDay="" + aheadOneDay.getFullYear() + '-' + (aheadOneDay.getMonth()+1) + '-' + (aheadOneDay.getDate());  

            LiquidPlanner.newTreeitems = resource(':host/:api_path/workspaces/:space_id/treeitems/?filter[]=last_updated%20after%20' + backOneDay + '&filter[]=last_updated%20before%20' + aheadOneDay + '&filter_context=true');

            LiquidPlanner.newTreeitems({
              success: function(items){
                loadTree(items);
                formatDisplay();
                }
            });
        },

        first_day_of_week: 0
    });
});
