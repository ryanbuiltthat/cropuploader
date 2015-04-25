MySlingShotName = 'fucketyfuck';

Slingshot.fileRestrictions(MySlingShotName, {
  allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
  maxSize: 10 * 1024 * 1024 // 10 MB (use null for unlimited)
});

if(Meteor.isClient)
{
	CropUploader.init(MySlingShotName, 'slingshot');

	// counter starts at 0
	Session.setDefault('counter', 0);
	Session.setDefault('template', 'hello');

	Template.registerHelper('template',function(){
	  return Session.get('template');
	});

	Template.hello.helpers({
	  counter: function () {
	    return Session.get('counter');
	  },
	});

	Template.hello.events({
	  'click button.hello': function () {
	    // increment the counter when button is clicked
	    Session.set('counter', Session.get('counter') + 1);
	    Meteor.call('s3contents','slingshot', function(err,res){
	      if(!err) res.forEach(function(obj){
	        console.log(obj.Key);
	      });
	    });
	  },
	});

	// Template.cropper.
	Template.images.onCreated(function(){
		this.subscribe('cropUploaderImages');
	})
	Template.images.onRendered(function(){
	  this.$('.preview').addClass('hidden');
	});
	Template.images.helpers({
	  images: function() {
	    return CropUploader.images.find();
	  }
	});
	Template.images.events({
	  // 'mouseenter img':function(e,t) {
	  //   var image = CropUploader.images.findOne(e.target.id);
	  //   if(image) {
	  //     $('html').css({
	  //       background: 'url('+image.url+') no-repeat center center fixed',
	  //       backgroundSize: 'cover'
	  //     })
	  //   }
	  // },
	  // 'mouseleave img': function(e,t) {
	  //   $('html').css('background','none');
	  // },
	  'click img': function(e,t) {
	    // if(confirm('Delete this image?'))
	    // {
	    //   CropUploader.images.remove(e.target.id);
	    // }
	    Session.set('image', CropUploader.images.findOne( e.target.id) );
	    Session.set('template', 'cropper');
	  }
	});

	Template.cropper.onCreated(function(){
	  this.subscribe('cropUploaderImages');
	});
	Template.cropper.helpers({
	  imageid: function() {
	    return Session.get('image')._id;
	  },
	  url: function() {
	    return Session.get('image').url;
	  }
	});
	Template.cropper.events({
	  'click button.back': function(){
	    Session.set('template', 'hello');
	  },
	  'click button.delete': function(e,t) {
	    if(confirm('Delete this image?'))
	    {
	      var imageid = t.$(e.target).attr('imageid');
	      CropUploader.images.remove(imageid);
	      Session.set('template', 'hello');
	    }
	  },
	  'click button.save': function(e,t) {
	    CropUploader.crop.save('thumbnail');
	  },
	  'click button.rotate': function(e,t) {
	    CropUploader.crop.rotate();
	  }
	});

	CropUploader.init(MySlingShotName, 'slingshot');
}

if(Meteor.isServer)
{
	Slingshot.createDirective(MySlingShotName, Slingshot.S3Storage, {
	  bucket: Meteor.settings.S3Bucket,
	  acl: "public-read",
	  authorize: function () {
		// Deny uploads if user is not logged in.
		if (!this.userId) {
		  var message = "Please login before posting files";
		  throw new Meteor.Error("Login Required", message);
		}
		return true;
	  },
	  key: function(file) {  }
	});

	CropUploader.init(MySlingShotName, Meteor.settings.S3Directory, true);
}