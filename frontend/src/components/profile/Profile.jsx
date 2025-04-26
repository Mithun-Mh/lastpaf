import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import { API_BASE_URL } from '../../config/apiConfig';
import { storage } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../common/Navbar';
import { useToast } from '../common/Toast';

// Import components
import ProfileHeader from './components/ProfileHeader';
import AboutSection from './components/AboutSection';
import PostsTab from './components/PostsTab';
import LearningTab from './components/LearningTab';
import AchievementsTab from './components/AchievementsTab';
import FollowModal from './components/FollowModal';
import PostCreationModal from './components/PostCreationModal';
import SharePostModal from '../common/SharePostModal';
import LearningStreakSection from './components/LearningStreakSection';

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    skills: [],
  });
  const [error, setError] = useState(null);

  // Image upload state
  const [imageUpload, setImageUpload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Follow modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followData, setFollowData] = useState([]);
  const [isLoadingFollowData, setIsLoadingFollowData] = useState(false);

  // Post state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState(null);
  const [postMediaPreview, setPostMediaPreview] = useState(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const postFileInputRef = useRef(null);

  // Shared post state
  const [showShareModal, setShowShareModal] = useState(false);
  const [postToShare, setPostToShare] = useState(null);

  // Add a refresh trigger state for streak component
  const [streakRefreshTrigger, setStreakRefreshTrigger] = useState(0);

  // Add this like post handler function
  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();

      // Update post likes in state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: data.liked
                  ? [...(post.likes || []), currentUser.id]
                  : (post.likes || []).filter((id) => id !== currentUser.id),
              }
            : post
        )
      );

      addToast(data.liked ? 'Post liked!' : 'Post unliked!', 'success');
    } catch (error) {
      console.error('Error liking post:', error);
      addToast('Failed to like post', 'error');
    }
  };

  const handleSharePost = (post) => {
    setPostToShare(post);
    setShowShareModal(true);
  };

  // Add this handler to update posts when comments are added
  const handlePostUpdated = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  // Update the user state handler to be able to refresh user data when skills are updated
  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    // Increment the refresh trigger to force streak component to update
    setStreakRefreshTrigger((prev) => prev + 1);
  };

  // Fetch profile data - either current user or another user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/auth');
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        setCurrentUser(data);

        if (!userId) {
          setUser(data);
          setIsCurrentUserProfile(true);
          setEditForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            bio: data.bio || '',
            skills: data.skills || [],
          });
        }
      } catch (error) {
        console.error('Error fetching current user profile:', error);
        addToast('Failed to load user data. Please try again.', 'error');
      }
    };

    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
        setIsCurrentUserProfile(currentUser?.id === data.id);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        addToast('Failed to load user profile. Please try again.', 'error');
        navigate('/dashboard');
      }
    };

    setIsLoading(true);
    fetchCurrentUser()
      .then(() => fetchUserProfile())
      .finally(() => setIsLoading(false));
  }, [navigate, userId, addToast]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;

    setIsLoadingPosts(true);
    try {
      const token = localStorage.getItem('token');
      const profileId = userId || (currentUser ? currentUser.id : null);

      if (!profileId) return;

      const response = await fetch(`${API_BASE_URL}/posts/user/${profileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUpload(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleImageUpload = async () => {
    if (!imageUpload) return null;

    try {
      setIsUploading(true);
      const imageName = `${user.id}_${Date.now()}_${imageUpload.name}`;
      const storageRef = ref(storage, `profileImages/${imageName}`);

      await uploadBytes(storageRef, imageUpload);

      const url = await getDownloadURL(storageRef);
      setIsUploading(false);

      return url;
    } catch (error) {
      console.error('Error uploading image: ', error);
      setIsUploading(false);
      addToast('Failed to upload image. Please try again.', 'error');
      return null;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      let profilePictureUrl = user.profilePicture;
      if (imageUpload) {
        profilePictureUrl = await handleImageUpload();
        if (!profilePictureUrl) {
          return;
        }
      }

      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        bio: editForm.bio,
        skills: editForm.skills,
        profilePicture: profilePictureUrl,
      };

      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      setImageUpload(null);
      setImagePreview(null);

      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('Failed to update profile. Please try again.', 'error');
    }
  };

  const handleSkillChange = (e) => {
    const skillsArray = e.target.value.split(',').map((skill) => skill.trim());
    setEditForm({
      ...editForm,
      skills: skillsArray,
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const fetchFollowData = async (type) => {
    setIsLoadingFollowData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/${type}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}`);
      }

      const data = await response.json();
      setFollowData(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setFollowData([]);
    } finally {
      setIsLoadingFollowData(false);
    }
  };

  const handleShowFollowers = () => {
    fetchFollowData('followers');
    setShowFollowersModal(true);
  };

  const handleShowFollowing = () => {
    fetchFollowData('following');
    setShowFollowingModal(true);
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const response = await fetch(`${API_BASE_URL}/users/${endpoint}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${endpoint} user`);
      }

      const type = showFollowersModal ? 'followers' : 'following';
      fetchFollowData(type);

      setFollowData((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isFollowing: !isFollowing }
            : user
        )
      );

      addToast(
        isFollowing ? 'Successfully unfollowed user' : 'Successfully followed user',
        'success'
      );
    } catch (error) {
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} user:`, error);
      addToast(error.message || `Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`, 'error');
    }
  };

  const handleFollowAction = async () => {
    if (!user || isCurrentUserProfile) return;

    const isFollowing = user.isFollowing;

    try {
      const token = localStorage.getItem('token');
      const endpoint = isFollowing ? 'unfollow' : 'follow';

      const response = await fetch(`${API_BASE_URL}/users/${endpoint}/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} user`);
      }

      setUser((prev) => ({
        ...prev,
        isFollowing: !isFollowing,
      }));

      addToast(
        isFollowing ? 'Successfully unfollowed user' : 'Successfully followed user',
        'success'
      );
    } catch (error) {
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} user:`, error);
      addToast(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`, 'error');
    }
  };

  const handlePostMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostMedia(file);
      const previewUrl = URL.createObjectURL(file);
      setPostMediaPreview(previewUrl);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!postContent.trim() && !postMedia) {
      addToast('Please add some content or media to your post', 'error');
      return;
    }

    setIsSubmittingPost(true);

    try {
      const token = localStorage.getItem('token');

      let mediaUrl = null;
      if (postMedia) {
        const mediaName = `post_${user.id}_${Date.now()}_${postMedia.name}`;
        const storageRef = ref(storage, `postMedia/${mediaName}`);

        await uploadBytes(storageRef, postMedia);
        mediaUrl = await getDownloadURL(storageRef);
      }

      const postData = {
        content: postContent,
        mediaUrl: mediaUrl,
        mediaType: postMedia
          ? postMedia.type.startsWith('image')
            ? 'IMAGE'
            : 'VIDEO'
          : null,
      };

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const newPost = await response.json();

      setPosts((prevPosts) => [newPost, ...prevPosts]);

      setPostContent('');
      setPostMedia(null);
      setPostMediaPreview(null);
      setShowPostModal(false);

      addToast('Post created successfully!', 'success');
    } catch (error) {
      console.error('Error creating post:', error);
      addToast('Failed to create post. Please try again.', 'error');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center text-red-500 mb-4">
            <i className='bx bx-error-circle text-6xl'></i>
          </div>
          <h2 className="text-2xl text-center font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar user={currentUser} />

      {/* Profile Header - This component's internal styling will be handled by ProfileHeader */}
      <ProfileHeader
        user={user}
        currentUser={currentUser}
        isCurrentUserProfile={isCurrentUserProfile}
        isEditing={isEditing}
        imagePreview={imagePreview}
        triggerFileInput={triggerFileInput}
        fileInputRef={fileInputRef}
        handleImageChange={handleImageChange}
        isUploading={isUploading}
        setIsEditing={setIsEditing}
        handleLogout={handleLogout}
        handleFollowAction={handleFollowAction}
        handleShowFollowers={handleShowFollowers}
        handleShowFollowing={handleShowFollowing}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        {/* Quick Stats Bar */}
        <div className="bg-white rounded-xl shadow-md mb-8 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-3 border-r border-gray-200">
              <span className="text-2xl font-bold text-indigo-600">{user?.postsCount || 0}</span>
              <span className="text-sm text-gray-500">Posts</span>
            </div>
            <div onClick={handleShowFollowers} className="flex flex-col items-center justify-center p-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl font-bold text-indigo-600">{user?.followersCount || 0}</span>
              <span className="text-sm text-gray-500">Followers</span>
            </div>
            <div onClick={handleShowFollowing} className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl font-bold text-indigo-600">{user?.followingCount || 0}</span>
              <span className="text-sm text-gray-500">Following</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h2 className="text-white text-xl font-semibold flex items-center">
                  <i className='bx bx-user-circle mr-2'></i> About
                </h2>
              </div>
              <div className="p-6">
                <AboutSection
                  user={user}
                  isEditing={isEditing}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  handleEditSubmit={handleEditSubmit}
                  handleSkillChange={handleSkillChange}
                  isUploading={isUploading}
                  imageUpload={imageUpload}
                  imagePreview={imagePreview}
                  setImageUpload={setImageUpload}
                  setImagePreview={setImagePreview}
                  triggerFileInput={triggerFileInput}
                  fileInputRef={fileInputRef}
                />
              </div>
            </div>
            
            {/* Learning Streak Section */}
            {user && (
              <div className="bg-white rounded-xl overflow-hidden shadow-md">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                  <h2 className="text-white text-xl font-semibold flex items-center">
                    <i className='bx bx-line-chart mr-2'></i> Learning Progress
                  </h2>
                </div>
                <div className="p-6">
                  <LearningStreakSection
                    user={user}
                    refreshTrigger={streakRefreshTrigger}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creation Quick Access */}
            {isCurrentUserProfile && (
              <div className="bg-white rounded-xl p-4 shadow-md flex items-center space-x-4">
                <img 
                  src={user?.profilePicture || '/assets/default-avatar.png'} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <button 
                  onClick={() => setShowPostModal(true)}
                  className="flex-1 text-left px-4 py-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Share your thoughts or learning progress...
                </button>
                <button 
                  onClick={() => setShowPostModal(true)}
                  className="p-2 rounded-full text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md"
                >
                  <i className='bx bx-plus text-xl'></i>
                </button>
              </div>
            )}
            
            {/* Tabs */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-4 px-6 text-center font-medium text-sm flex items-center justify-center transition-all ${
                      activeTab === 'posts'
                        ? 'bg-white border-t-4 border-indigo-600 text-indigo-700 shadow'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <i className={`bx bx-message-square-detail mr-2 text-xl ${activeTab === 'posts' ? 'text-indigo-600' : ''}`}></i>
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('learning')}
                    className={`flex-1 py-4 px-6 text-center font-medium text-sm flex items-center justify-center transition-all ${
                      activeTab === 'learning'
                        ? 'bg-white border-t-4 border-indigo-600 text-indigo-700 shadow'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <i className={`bx bx-book-open mr-2 text-xl ${activeTab === 'learning' ? 'text-indigo-600' : ''}`}></i>
                    Learning
                  </button>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className={`flex-1 py-4 px-6 text-center font-medium text-sm flex items-center justify-center transition-all ${
                      activeTab === 'achievements'
                        ? 'bg-white border-t-4 border-indigo-600 text-indigo-700 shadow'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    <i className={`bx bx-trophy mr-2 text-xl ${activeTab === 'achievements' ? 'text-indigo-600' : ''}`}></i>
                    Achievements
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'posts' && (
                  <PostsTab
                    isCurrentUserProfile={isCurrentUserProfile}
                    user={user}
                    currentUser={currentUser}
                    setShowPostModal={setShowPostModal}
                    postFileInputRef={postFileInputRef}
                    isLoadingPosts={isLoadingPosts}
                    posts={posts}
                    setPosts={setPosts}
                    formatPostDate={formatPostDate}
                    handleLikePost={handleLikePost}
                    handleSharePost={handleSharePost}
                    handlePostUpdated={handlePostUpdated}
                  />
                )}

                {activeTab === 'learning' && (
                  <LearningTab
                    user={user}
                    currentUser={currentUser}
                    isCurrentUserProfile={isCurrentUserProfile}
                  />
                )}

                {activeTab === 'achievements' && (
                  <AchievementsTab
                    user={user}
                    currentUser={currentUser}
                    onUserUpdated={handleUserUpdated}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Creation Modal */}
      <PostCreationModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        user={user}
        postContent={postContent}
        setPostContent={setPostContent}
        postMedia={postMedia}
        postMediaPreview={postMediaPreview}
        setPostMedia={setPostMedia}
        setPostMediaPreview={setPostMediaPreview}
        isSubmittingPost={isSubmittingPost}
        handleCreatePost={handleCreatePost}
        postFileInputRef={postFileInputRef}
      />

      {/* Followers Modal */}
      <FollowModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        data={followData}
        isLoading={isLoadingFollowData}
        onFollowToggle={handleFollowToggle}
      />

      {/* Following Modal */}
      <FollowModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        data={followData}
        isLoading={isLoadingFollowData}
        onFollowToggle={handleFollowToggle}
      />

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={postToShare}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="bg-white mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
              Fitness Hub
            </div>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <i className='bx bxl-facebook text-xl'></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <i className='bx bxl-twitter text-xl'></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <i className='bx bxl-instagram text-xl'></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <i className='bx bxl-linkedin text-xl'></i>
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 Flowiix (PVT)LTD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Profile;