$( document ).ready(function() {
	
	// UV Kaltura viewer: embed the Kaltura viewer, controls, and events
	$( "#uv" ).on("uvloaded", function(event, embedKalturaViewer, objectID, universalViewerMediaElement, viewerContent) {

		if(embedKalturaViewer) {
	  		$( "#uv" ).css("visibility", "hidden");
	  		//$( "#uv" ).css("height", "1090px");
	  		$( ".uv" ).css("height", "815px");
	  		$( ".mainPanel" ).css("height", "730px");

			setTimeout(function(){  
		  		$( "#uv" ).css("visibility", "visible");
		  		$("[id^=mep_]").html("");
		  		$("[id^=mep_]").append(viewerContent);

		  		$(".thumb").on("click", function(event) {
					let part = parseInt($(this)[0].id.replace("thumb", "")) + 1,
						uri = $(this)[0].baseURI,
						baseUrl = uri.substring(0, uri.indexOf("/object"));

		  			let kalturaViewerUri = baseUrl + "/viewer/kaltura/" + objectID + "/" + part;
		  			$.get(kalturaViewerUri, function(viewerContent, status){
					    if(status == "success") {
					    	$("[id^=mep_]").html(viewerContent);
					    }
					});
		  		});
		  	}, 500);
	  	}

	  	// Append the 'show transcript' button, attach the toggle visibility event
	  	$("#object-view-controls").append("<button id='show-uv-kaltura-transcript-player' type='button'>View Transcript</button>");
	  	$("#show-uv-kaltura-transcript-player").click(function(event) {

	  		// Show the transcript viewer
	  		if($(".kaltura-viewer").hasClass("transcript-visible") == false) {
	  			$( ".uv" ).css("height", "1090px");
				$( ".mainPanel" ).css("height", "1008px");
				$("#show-uv-kaltura-transcript-player").html("Hide Transcript");
				$(".kaltura-viewer").addClass("transcript-visible");
	  		}

	  		// Hide the transcript viewer
	  		else {
	  			$( ".uv" ).css("height", "815px");
				$( ".mainPanel" ).css("height", "730px");
				$("#show-uv-kaltura-transcript-player").html("View Transcript");
				$(".kaltura-viewer").removeClass("transcript-visible");
	  		}
	  	});
	});
});

