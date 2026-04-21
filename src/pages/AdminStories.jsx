import React, { useState, useEffect, useRef } from 'react';
import {
    Home, Users, DollarSign, PieChart, FileText, BarChart3,
    UserCog, Settings, AlertTriangle, Search, Menu, X, LogOut,
    Plus, Edit, Trash2, Calendar, Target, TrendingUp, Image as ImageIcon,
    MapPin, MoreVertical, Filter, ChevronDown, Upload, Star,
    Send, FileEdit, Eye, EyeOff, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Custom Quill Toolbar Modules
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }], // alignment: left, center, right, justify
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image', 'video'],
        ['clean']
    ]
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'color', 'background',
    'link', 'image', 'video'
];

// ── Semantic tag suggestions map (donation-focused) ─────────────────────────
const TAG_SYNONYMS = {
    // ── Age groups
    elderly:        ['Senior Care', 'Elderly Care', 'Senior Citizens', 'Aging Support', 'Geriatric Care', 'Retirement Aid'],
    senior:         ['Senior Care', 'Elderly Care', 'Senior Citizens', 'Aging Support', 'Geriatric Care'],
    aging:          ['Senior Citizens', 'Elderly Care', 'Aging Support', 'Geriatric Care'],
    child:          ['Children', 'Youth', 'Child Welfare', 'Child Development', 'Childcare', 'Kids', 'Minors'],
    youth:          ['Youth Development', 'Teens', 'Young Adults', 'Children', 'Kids', 'Scholar Program'],
    teen:           ['Teens', 'Youth', 'Young Adults', 'Adolescents', 'Youth Development'],
    infant:         ['Infants', 'Newborns', 'Maternal Care', 'Childcare', 'Child Health'],
    // ── Education
    education:      ['Learning', 'Literacy', 'Scholarship', 'Academic Support', 'Schooling', 'Tutoring', 'School Supplies'],
    school:         ['Education', 'Learning', 'Literacy', 'Academic Support', 'Scholarship', 'School Feeding'],
    scholar:        ['Scholarship', 'Education', 'Academic Support', 'Tuition Aid', 'Student Grant'],
    literacy:       ['Reading Program', 'Education', 'Learning', 'Basic Education', 'Adult Education'],
    tuition:        ['Tuition Aid', 'Scholarship', 'Education', 'Student Grant', 'School Fees'],
    training:       ['Skills Training', 'Livelihood', 'Vocational', 'Employment', 'Capacity Building'],
    vocational:     ['Skills Training', 'Technical Education', 'TESDA', 'Livelihood', 'Trade Skills'],
    // ── Health & Medical
    health:         ['Healthcare', 'Medical Aid', 'Wellness', 'Mental Health', 'Public Health', 'Nutrition', 'Free Clinic'],
    medical:        ['Healthcare', 'Medical Aid', 'Hospital', 'Medicine', 'Treatment', 'Wellness', 'Free Medical'],
    hospital:       ['Medical Aid', 'Healthcare', 'Hospitalization', 'Free Clinic', 'Medicine', 'Treatment'],
    medicine:       ['Medical Aid', 'Healthcare', 'Treatment', 'Pharmacy Aid', 'Drug Access'],
    mental:         ['Mental Health', 'Psychological Support', 'Counseling', 'Wellbeing', 'Therapy', 'Stress Relief'],
    nutrition:      ['Food Aid', 'Feeding Program', 'Malnutrition', 'Health', 'Child Nutrition'],
    vaccine:        ['Immunization', 'Child Health', 'Public Health', 'Healthcare', 'Disease Prevention'],
    dental:         ['Dental Care', 'Oral Health', 'Free Clinic', 'Healthcare', 'Medical Aid'],
    // ── Food & Hunger
    food:           ['Nutrition', 'Hunger Relief', 'Food Aid', 'Feeding Program', 'Malnutrition', 'Food Security'],
    hunger:         ['Food Aid', 'Nutrition', 'Hunger Relief', 'Feeding Program', 'Food Security', 'Zero Hunger'],
    feeding:        ['Feeding Program', 'Food Aid', 'Nutrition', 'Hunger Relief', 'School Feeding'],
    malnutrition:   ['Nutrition', 'Food Aid', 'Feeding Program', 'Child Nutrition', 'Health'],
    // ── Shelter & Housing
    shelter:        ['Housing', 'Homeless', 'Refuge', 'Disaster Relief', 'Housing Support', 'Evacuation Center'],
    housing:        ['Shelter', 'Homeless', 'Housing Support', 'Affordable Housing', 'Relocation'],
    homeless:       ['Shelter', 'Housing', 'Street Dwellers', 'Urban Poor', 'Housing Support'],
    // ── Disaster & Emergency
    disaster:       ['Calamity', 'Emergency Relief', 'Disaster Relief', 'Crisis Support', 'Rescue', 'Typhoon Relief'],
    calamity:       ['Disaster Relief', 'Emergency Aid', 'Crisis Response', 'Rescue', 'Typhoon Aid'],
    typhoon:        ['Typhoon Relief', 'Disaster Relief', 'Emergency Aid', 'Calamity', 'Crisis Support'],
    flood:          ['Flood Relief', 'Disaster Relief', 'Emergency Aid', 'Calamity', 'Evacuation'],
    earthquake:     ['Earthquake Relief', 'Disaster Relief', 'Emergency Aid', 'Crisis Support', 'Rescue'],
    emergency:      ['Emergency Aid', 'Disaster Relief', 'Crisis Response', 'Rescue', 'Relief Operations'],
    relief:         ['Disaster Relief', 'Emergency Aid', 'Calamity Relief', 'Crisis Response', 'Relief Goods'],
    rescue:         ['Emergency Relief', 'Disaster Response', 'Search and Rescue', 'Crisis Aid'],
    // ── Poverty & Livelihood
    poverty:        ['Livelihood', 'Economic Aid', 'Financial Assistance', 'Welfare', 'Indigent', 'Subsistence'],
    livelihood:     ['Skills Training', 'Employment', 'Entrepreneurship', 'Economic Aid', 'Microfinance'],
    employment:     ['Livelihood', 'Job Placement', 'Skills Training', 'Economic Aid', 'Work Program'],
    microfinance:   ['Livelihood', 'Micro-lending', 'Small Business', 'Economic Aid', 'Entrepreneurship'],
    entrepreneur:   ['Entrepreneurship', 'Small Business', 'Livelihood', 'Microfinance', 'Self-Employment'],
    indigent:       ['Poverty', 'Financial Assistance', 'Welfare', 'Economic Aid', 'Subsistence'],
    // ── Women & Gender
    women:          ["Women's Rights", 'Gender Equality', 'Mothers', 'Female Empowerment', 'Maternal', 'Solo Parent'],
    gender:         ["Women's Rights", 'Gender Equality', 'LGBTQ+', 'Female Empowerment', 'Gender-Based Violence'],
    maternal:       ['Maternal Care', 'Mothers', "Women's Health", 'Child Health', 'Prenatal Care'],
    solo:           ['Solo Parent', 'Single Mother', 'Family Support', "Women's Welfare"],
    // ── Environment
    environment:    ['Ecology', 'Conservation', 'Green', 'Reforestation', 'Climate', 'Nature', 'Sustainability'],
    climate:        ['Climate Change', 'Ecology', 'Conservation', 'Reforestation', 'Green Advocacy'],
    reforestation:  ['Tree Planting', 'Environment', 'Ecology', 'Conservation', 'Nature'],
    ocean:          ['Marine Conservation', 'Ocean Cleanup', 'Ecology', 'Environment', 'Coastal'],
    // ── Disability
    disability:     ['Persons with Disability', 'PWD', 'Special Needs', 'Accessibility', 'Inclusive'],
    pwd:            ['Persons with Disability', 'Special Needs', 'Disability Support', 'Accessibility'],
    special:        ['Special Needs', 'Persons with Disability', 'PWD', 'Inclusive Education'],
    // ── Community
    community:      ['Community Development', 'Grassroots', 'Neighborhood', 'Local Support', 'Barangay'],
    barangay:       ['Community', 'Local Support', 'Grassroots', 'Neighborhood Development'],
    rural:          ['Rural Development', 'Remote Communities', 'Agricultural Aid', 'Community Support'],
    urban:          ['Urban Poor', 'City Development', 'Community', 'Slum Improvement'],
    // ── Water & Sanitation
    water:          ['Clean Water', 'Sanitation', 'WASH', 'Water Access', 'Water Safety', 'Potable Water'],
    sanitation:     ['WASH', 'Clean Water', 'Hygiene', 'Public Health', 'Waste Management'],
    hygiene:        ['Sanitation', 'WASH', 'Clean Water', 'Public Health', 'Hygiene Kits'],
    // ── Faith & Spiritual
    spiritual:      ['Faith-Based', 'Religion', 'Church', 'Ministry', 'Pastoral Care', 'Mission'],
    faith:          ['Faith-Based', 'Spiritual', 'Church', 'Ministry', 'Mission', 'Pastoral Care'],
    mission:        ['Outreach', 'Ministry', 'Faith-Based', 'Evangelical', 'Community Mission'],
    outreach:       ['Community Outreach', 'Mission', 'Ministry', 'Relief Operations', 'Social Work'],
    // ── Indigenous
    indigenous:     ['Indigenous People', 'Tribal', 'Cultural Heritage', 'IP Communities', 'Lumad', 'Ancestral Domain'],
    tribal:         ['Indigenous People', 'Tribal Communities', 'Cultural Heritage', 'IP Communities'],
    // ── Animals
    animal:         ['Animal Welfare', 'Wildlife', 'Rescue', 'Veterinary', 'Pet Support', 'Stray Animals'],
    wildlife:       ['Animal Welfare', 'Conservation', 'Environment', 'Wildlife Protection', 'Ecology'],
    // ── Arts & Culture
    arts:           ['Culture', 'Creative Arts', 'Music', 'Drama', 'Cultural Heritage', 'Fine Arts'],
    culture:        ['Cultural Heritage', 'Arts', 'Music', 'Traditions', 'Indigenous Culture'],
    // ── Sports & Recreation
    sports:         ['Athletics', 'Youth Sports', 'Recreation', 'Physical Wellness', 'Sports Program'],
    // ── Donation-specific
    donation:       ['General Donation', 'Charitable Giving', 'Philanthropy', 'Donors', 'Fundraising'],
    fundraising:    ['Fundraiser', 'Charity Event', 'Donation Drive', 'Campaign', 'Crowdfunding'],
    volunteer:      ['Volunteering', 'Community Service', 'Outreach', 'Social Work', 'Civic Action'],
    charity:        ['Charitable', 'Philanthropy', 'Non-profit', 'Donation', 'Foundation'],
    scholarship:    ['Education', 'Tuition Aid', 'Student Grant', 'Academic Support', 'Scholar Program'],
    medical_mission:['Free Medical', 'Medical Outreach', 'Free Clinic', 'Healthcare', 'Medical Aid'],
    goods:          ['Relief Goods', 'Donation Drive', 'Food Aid', 'Livelihood Supplies', 'In-Kind Donation'],
    cash:           ['Cash Assistance', 'Financial Aid', 'Monetary Donation', 'Direct Giving'],
    sponsor:        ['Sponsorship', 'Scholar Sponsor', 'Patron', 'Benefactor', 'Corporate Giving'],
    beneficiary:    ['Beneficiaries', 'Recipients', 'Program Participants', 'Aid Recipients'],
    impact:         ['Success Story', 'Change Maker', 'Transformational', 'Community Impact'],
    story:          ['Success Story', 'Testimony', 'Impact Story', 'Donor Story', 'Beneficiary Story'],
    testimony:      ['Success Story', 'Testimony', 'Impact Story', 'Life Change', 'Transformation'],
    success:        ['Success Story', 'Achievement', 'Impact', 'Transformation', 'Progress'],
    help:           ['Aid', 'Assistance', 'Support', 'Relief', 'Outreach', 'Charity'],
    support:        ['Aid', 'Assistance', 'Help', 'Relief', 'Community Support'],
    campaign:       ['Fundraising Campaign', 'Donation Drive', 'Cause', 'Advocacy', 'Initiative'],
    advocate:       ['Advocacy', 'Campaign', 'Awareness', 'Social Change', 'Reform'],
    awareness:      ['Advocacy', 'Awareness Campaign', 'Social Issue', 'Education', 'Outreach'],

    // ── Foundation-specific keywords (SVRTV Partner Foundations) ────────────
    // 1. Anawim — Elderly Home
    anawim:         ['Elderly Home', 'Senior Living', 'Senior Care', 'Aging Support', 'Geriatric Care', 'Retirement Aid', 'Residential Care'],
    'home for the aged': ['Elderly Home', 'Senior Living', 'Senior Care', 'Anawim', 'Aging Support'],
    'old age':      ['Senior Care', 'Elderly Home', 'Aging Support', 'Geriatric Care', 'Senior Citizens'],
    aged:           ['Elderly Care', 'Senior Citizens', 'Aging Support', 'Residential Care'],
    grandparent:    ['Senior Care', 'Elderly Home', 'Aging Support', 'Senior Citizens'],
    lolo:           ['Senior Citizens', 'Elderly Care', 'Aging Support', 'Elderly Home'],
    lola:           ['Senior Citizens', 'Elderly Care', 'Aging Support', 'Elderly Home'],

    // 2. Jeremiah Foundation — Abused Girls
    jeremiah:       ['Abused Girls', 'Child Abuse', 'Trauma Recovery', 'Rescue & Rehabilitation', 'Safe House', "Women's Welfare"],
    abuse:          ['Abused Girls', 'Trauma Recovery', 'Child Abuse', 'Safe House', 'Rescue & Rehabilitation', 'GBV Support'],
    abused:         ['Abused Girls', 'Child Abuse', 'Trauma Recovery', 'Safe House', 'Rehabilitation', 'Victim Support'],
    trauma:         ['Trauma Recovery', 'Psychological Support', 'Counseling', 'Safe House', 'Rescue & Rehabilitation'],
    survivor:       ['Survivor', 'Trauma Recovery', 'Rehabilitation', 'Empowerment', 'Safe House'],
    victim:         ['Victim Support', 'Trauma Recovery', 'Safe House', 'Rescue & Rehabilitation', 'GBV Support'],
    gbv:            ['Gender-Based Violence', 'Victim Support', 'Safe House', 'Trauma Recovery', 'Abused Girls'],
    violence:       ['GBV Support', 'Abused Girls', 'Safe House', 'Trauma Recovery', 'Child Abuse'],
    safehouse:      ['Safe House', 'Abused Girls', 'Rescue & Rehabilitation', 'Shelter', 'Trauma Recovery'],

    // 3. Grace to be Born — Unwed Mothers
    grace:          ['Unwed Mothers', 'Maternal Care', 'Newborn Support', 'Pregnancy Aid', 'Mother & Child'],
    unwed:          ['Unwed Mothers', 'Maternal Care', 'Single Mother', 'Pregnancy Aid', 'Mother & Child'],
    pregnant:       ['Pregnancy Aid', 'Unwed Mothers', 'Maternal Care', 'Prenatal Care', 'Mother & Child'],
    pregnancy:      ['Pregnancy Aid', 'Prenatal Care', 'Maternal Care', 'Unwed Mothers', 'Newborn Support'],
    newborn:        ['Newborn Support', 'Maternal Care', 'Infant Care', 'Pregnancy Aid', 'Mother & Child'],
    prenatal:       ['Prenatal Care', 'Pregnancy Aid', 'Maternal Care', 'Unwed Mothers', 'Mother & Child'],
    postnatal:      ['Postnatal Care', 'Maternal Care', 'Newborn Support', 'Mother & Child'],
    mother:         ['Unwed Mothers', 'Maternal Care', 'Solo Parent', 'Mother & Child', 'Family Support'],
    nanay:          ['Unwed Mothers', 'Maternal Care', 'Mother & Child', 'Solo Parent'],

    // 4. Pag-Asa ng Pamilya — Scholarships
    'pag-asa':      ['Scholarship', 'Education', 'Family Support', 'Academic Aid', 'School Supplies', 'Tuition Aid'],
    pagasa:         ['Scholarship', 'Education', 'Family Support', 'Academic Aid', 'Youth Development'],
    pamilya:        ['Family Support', 'Scholarship', 'Education', 'Child Welfare', 'Community Development'],
    family:         ['Family Support', 'Scholarship', 'Child Welfare', 'Pag-Asa ng Pamilya', 'Community Support'],
    hope:           ['Hope', 'Scholarship', 'Education', 'Youth Development', 'Transformation'],

    // 5. SVRTV Foundation — Media Evangelization
    svrtv:          ['Media Evangelization', 'Radio Ministry', 'Television Ministry', 'Broadcast', 'Faith-Based Media', 'Evangelism'],
    media:          ['Media Evangelization', 'Radio Ministry', 'Television Ministry', 'Broadcast', 'Faith-Based Media'],
    radio:          ['Radio Ministry', 'Media Evangelization', 'Broadcast', 'Faith-Based Media', 'Evangelism'],
    television:     ['Television Ministry', 'Media Evangelization', 'Broadcast', 'Evangelism', 'Faith-Based Media'],
    broadcast:      ['Broadcast', 'Media Evangelization', 'Radio Ministry', 'Television Ministry'],
    evangelism:     ['Evangelism', 'Ministry', 'Media Evangelization', 'Mission', 'Faith-Based'],
    evangelize:     ['Evangelism', 'Media Evangelization', 'Ministry', 'Mission', 'Faith-Based Media'],
    shepherd:       ['Pastoral Care', 'Ministry', 'Faith-Based', 'Evangelism', 'Community Mission'],

    // 6. LOJ Prison Ministry — Women Inmates
    prison:         ['Prison Ministry', 'Women Inmates', 'Rehabilitation', 'Reintegration', 'Inmates', 'Jail Ministry'],
    jail:           ['Jail Ministry', 'Prison Ministry', 'Women Inmates', 'Rehabilitation', 'Reintegration'],
    inmate:         ['Women Inmates', 'Prison Ministry', 'Rehabilitation', 'Reintegration', 'Jail Ministry'],
    inmates:        ['Women Inmates', 'Prison Ministry', 'Rehabilitation', 'Reintegration', 'Jail Ministry'],
    detention:      ['Women Inmates', 'Prison Ministry', 'Rehabilitation', 'Jail Ministry'],
    rehabilitation: ['Rehabilitation', 'Reintegration', 'Prison Ministry', 'Women Inmates', 'Trauma Recovery'],
    reintegration:  ['Reintegration', 'Rehabilitation', 'Prison Ministry', 'Women Inmates', 'Life Skills'],
    loj:            ['Prison Ministry', 'Pastoral Care', 'Ministry', 'Women Inmates', 'Counseling', 'Faith-Based'],

    // 7. LOJ Pastoral Care — Counseling
    pastoral:       ['Pastoral Care', 'Counseling', 'Spiritual Support', 'Mental Health', 'Ministry', 'Wellbeing'],
    counseling:     ['Pastoral Care', 'Counseling', 'Mental Health', 'Psychological Support', 'Wellbeing'],
    counsel:        ['Pastoral Care', 'Counseling', 'Psychological Support', 'Wellbeing', 'Therapy'],
    therapist:      ['Counseling', 'Therapy', 'Psychological Support', 'Mental Health', 'Pastoral Care'],
    wellbeing:      ['Wellbeing', 'Pastoral Care', 'Counseling', 'Mental Health', 'Psychological Support'],
    emotional:      ['Emotional Support', 'Counseling', 'Pastoral Care', 'Psychological Support', 'Wellbeing'],

    // 8. He Cares Mission — Street Children
    'he cares':     ['Street Children', 'Street Kids', 'Mission', 'Child Welfare', 'Urban Poor', 'Outreach'],
    hecares:        ['Street Children', 'Street Kids', 'Mission', 'Child Welfare', 'Urban Poor'],
    street:         ['Street Children', 'Street Kids', 'Urban Poor', 'Homeless', 'Child Welfare', 'Outreach'],
    streetkids:     ['Street Children', 'Street Kids', 'Urban Poor', 'Child Welfare', 'Mission'],
    'street children': ['Street Children', 'Child Welfare', 'Urban Poor', 'Mission', 'Outreach'],
    'street kids':  ['Street Kids', 'Street Children', 'Urban Poor', 'Child Welfare', 'Mission'],
    batang:         ['Street Children', 'Child Welfare', 'Youth', 'Urban Poor'],
    kalye:          ['Street Children', 'Urban Poor', 'Street Kids', 'Child Welfare'],

    // 9. JCCFC — Cancer Patients
    jccfc:          ['Cancer Patients', 'Cancer Care', 'Oncology', 'Medical Aid', 'Terminal Illness', 'Patient Support'],
    cancer:         ['Cancer Patients', 'Cancer Care', 'Oncology', 'Medical Aid', 'Terminal Illness', 'JCCFC'],
    oncology:       ['Cancer Care', 'Oncology', 'Cancer Patients', 'Medical Aid', 'Terminal Illness'],
    terminal:       ['Terminal Illness', 'Cancer Care', 'Palliative Care', 'Medical Aid', 'Patient Support'],
    palliative:     ['Palliative Care', 'Terminal Illness', 'Cancer Patients', 'Patient Support', 'Hospice'],
    chemotherapy:   ['Cancer Care', 'Cancer Patients', 'Medical Aid', 'Oncology', 'Treatment Support'],
    chemo:          ['Cancer Care', 'Cancer Patients', 'Medical Aid', 'Oncology', 'Treatment Support'],
    patient:        ['Patient Support', 'Medical Aid', 'Cancer Patients', 'Healthcare', 'Hospital'],
};

const getSemanticSuggestions = (query, existingCategories, selectedTags) => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const suggestions = new Set();
    Object.entries(TAG_SYNONYMS).forEach(([keyword, related]) => {
        if (keyword.includes(q) || q.includes(keyword)) {
            related.forEach(r => suggestions.add(r));
        }
    });
    const catNames = existingCategories.map(c => c.name.toLowerCase());
    return [...suggestions].filter(s =>
        !catNames.includes(s.toLowerCase()) &&
        !selectedTags.includes(s)
    ).slice(0, 8);
};
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminStories() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [stories, setStories] = useState([]);
    const [foundations, setFoundations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isManagingCategories, setIsManagingCategories] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingStory, setEditingStory] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [keepExistingImages, setKeepExistingImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const SLIDE_DURATION = 5000;
    const [activeTab, setActiveTab] = useState('draft');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingStory, setViewingStory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState(null);
    const [publishMode, setPublishMode] = useState('draft'); // draft, now, scheduled
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const tagDropdownRef = useRef(null);
    const tagInputRef = useRef(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalStory, setStatusModalStory] = useState(null);
    const [statusModalValue, setStatusModalValue] = useState('draft');
    const [statusModalScheduleDate, setStatusModalScheduleDate] = useState('');

    const getLoggedUserName = () => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
            return fullName || u.email || 'System User';
        } catch {
            return 'System User';
        }
    };
    const defaultAuthor = getLoggedUserName();

    const [formData, setFormData] = useState({
        title: '',
        foundation_id: '',
        content: '',
        tags: [],
        author: defaultAuthor,
        is_published: false,
        scheduled_publish_at: ''
    });

    useEffect(() => {
        fetchStories();
        fetchFoundations();
        fetchStoryCategories();
    }, []);

    // Close tag dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
                setShowTagDropdown(false);
                setTagSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-slide effect for View Modal
    useEffect(() => {
        if (!showViewModal || !viewingStory || !viewingStory.images || viewingStory.images.length <= 1 || isPaused) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return;
        }

        const runNextSlide = () => {
            setCurrentImageIndex(prev => (prev + 1) % viewingStory.images.length);
            setProgress(0);
        };

        timerRef.current = setInterval(runNextSlide, SLIDE_DURATION);

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                return prev + (100 / (SLIDE_DURATION / 100));
            });
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [showViewModal, viewingStory, isPaused]);

    // Separate stories by status
    const publishedStories = stories.filter(s => s.is_published);
    const scheduledStories = stories.filter(s => !s.is_published && s.scheduled_publish_at && s.scheduled_publish_at !== null);
    const draftStories = stories.filter(s => !s.is_published && (!s.scheduled_publish_at || s.scheduled_publish_at === null));

    // Filter the active tab's stories
    const activeStories = 
        activeTab === 'draft' ? draftStories : 
        activeTab === 'publish' ? publishedStories : 
        scheduledStories;

    const filteredStories = activeStories
        .filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            return 0;
        });

    // Stats
    const stats = {
        totalStories: stories.length,
        draftCount: draftStories.length,
        publishedCount: publishedStories.length,
        scheduledCount: scheduledStories.length
    };

    const fetchStories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/stories/all');
            const data = await response.json();
            if (Array.isArray(data)) {
                setStories(data);
            } else {
                setStories([]);
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
            toast.error('Failed to load stories');
            setStories([]);
        }
    };

    const fetchFoundations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/foundations/all');
            const data = await response.json();
            if (Array.isArray(data)) {
                setFoundations(data);
            } else {
                setFoundations([]);
            }
        } catch (error) {
            console.error('Error fetching foundations:', error);
            toast.error('Failed to load foundations');
            setFoundations([]);
        }
    };

    const fetchStoryCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/story-categories');
            const data = await response.json();
            if (Array.isArray(data)) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Silently save a new custom tag to the story_categories table.
    // If it already exists (409/400 from backend), we just ignore it.
    const saveTagToCategories = async (tagName) => {
        if (!tagName || !tagName.trim()) return;
        try {
            const response = await fetch('http://localhost:5000/api/admin/story-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tagName.trim() })
            });
            if (response.ok) {
                // Refresh the category list so it shows up immediately in Manage Categories
                fetchStoryCategories();
                toast.success(`Added "${tagName}" to Manage Categories`, { duration: 3000 });
            }
            // If 400 (already exists) or other error — silently ignore, tag is still added to the story
        } catch (err) {
            console.warn('Could not save tag to categories:', err.message);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const response = await fetch('http://localhost:5000/api/admin/story-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Category added');
                setNewCategoryName('');
                fetchStoryCategories();
            } else {
                toast.error(data.message || 'Failed to add');
            }
        } catch (error) {
            toast.error('Error adding category');
        }
    };

    const handleUpdateCategory = async (id) => {
        if (!newCategoryName.trim()) return;
        try {
            const response = await fetch(`http://localhost:5000/api/admin/story-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName })
            });
            if (response.ok) {
                toast.success('Category updated');
                setEditingCategory(null);
                setNewCategoryName('');
                fetchStoryCategories();
            }
        } catch (error) { toast.error('Error updating'); }
    };

    const handleDeleteCategory = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/story-categories/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                toast.success('Category deleted');
                fetchStoryCategories();
                setCategoryToDelete(null);
            }
        } catch (error) { toast.error('Error deleting'); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedImages(prev => [...prev, ...files]);
            const newUrls = files.map(file => URL.createObjectURL(file));
            setImagePreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const removeNewImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imageId) => {
        setKeepExistingImages(prev => prev.filter(id => id !== imageId));
    };

    const handleEdit = (story) => {
        setEditingStory(story);
        setFormData({
            title: story.title,
            foundation_id: story.foundation_id || '',
            content: story.content || '',
            tags: story.tags ? story.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            author: story.author || defaultAuthor,
            is_published: story.is_published || false,
            scheduled_publish_at: story.scheduled_publish_at ? story.scheduled_publish_at.split('.')[0] : ''
        });

        if (story.is_published) {
            setPublishMode('now');
        } else if (story.scheduled_publish_at) {
            setPublishMode('scheduled');
        } else {
            setPublishMode('draft');
        }

        const images = story.images || [];
        setExistingImages(images);
        setKeepExistingImages(images.map(img => img.image_id));
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setShowForm(true);
        setTimeout(() => {
            document.getElementById('story-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDelete = (storyId) => {
        setStoryToDelete(storyId);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Story title is required');
            return;
        }
        if (!formData.foundation_id) {
            toast.error('Please select a foundation');
            return;
        }

        try {
            setIsLoading(true);

            const url = editingStory
                ? `http://localhost:5000/api/stories/update/${editingStory.story_id}`
                : 'http://localhost:5000/api/stories/create';

            const method = editingStory ? 'PUT' : 'POST';

            const body = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'tags') {
                    // Join array to comma-separated string for backend
                    body.append('tags', Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags);
                } else {
                    body.append(key, formData[key]);
                }
            });
            
            selectedImages.forEach(image => {
                body.append('images', image);
            });

            keepExistingImages.forEach(id => {
                body.append('keepExistingImages', id);
            });

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.user_id) {
                body.append('userId', user.user_id);
            }

            const response = await fetch(url, { method, body });
            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                fetchStories();
                
                // Switch tab before resetting form
                if (!editingStory) {
                    if (formData.is_published) setActiveTab('publish');
                    else if (formData.scheduled_publish_at) setActiveTab('scheduled');
                    else setActiveTab('draft');
                }
                resetForm();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to save story');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (storyId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`http://localhost:5000/api/stories/status/${storyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_published: newStatus,
                    userId: user.user_id || null
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                fetchStories();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update story status');
        }
    };

    const handleStatusChange = async (storyId, newValue) => {
        const isPublished = newValue === 'published';
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`http://localhost:5000/api/stories/status/${storyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_published: isPublished, userId: user.user_id || null })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                fetchStories();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Failed to update story status');
        }
    };

    const handleStatusModalConfirm = async () => {
        if (!statusModalStory) return;
        const storyId = statusModalStory.story_id;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            if (statusModalValue === 'schedule') {
                if (!statusModalScheduleDate) {
                    toast.error('Please select a scheduled date and time.');
                    return;
                }
                await fetch(`http://localhost:5000/api/stories/schedule/${storyId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scheduled_publish_at: statusModalScheduleDate, userId: user.user_id || null })
                }).then(r => r.json()).then(data => {
                    if (data.message) toast.success(data.message);
                });
            } else {
                await handleStatusChange(storyId, statusModalValue === 'publish' ? 'published' : 'draft');
            }
            setShowStatusModal(false);
            setStatusModalStory(null);
            fetchStories();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const confirmDelete = async () => {
        if (!storyToDelete) return;
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`http://localhost:5000/api/stories/delete/${storyToDelete}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId: user.user_id || null })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                fetchStories();
            } else {
                toast.error(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to delete story');
        } finally {
            setShowDeleteModal(false);
            setStoryToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            foundation_id: '',
            content: '',
            tags: [],
            author: defaultAuthor,
            is_published: false,
            scheduled_publish_at: ''
        });
        setPublishMode('draft');
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setExistingImages([]);
        setKeepExistingImages([]);
        setEditingStory(null);
        setShowForm(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafb]">
            <AdminSidebar
                activePage="stories"
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <main className="flex-1 overflow-y-auto">
                <AdminHeader
                    title="Stories"
                    subtitle="Manage foundation success stories"
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsManagingCategories(true)}
                            className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
                        >
                            Manage Categories
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                if (!showForm) {
                                    setTimeout(() => {
                                        document.getElementById('story-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }
                            }}
                            className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center gap-2 shadow-md"
                        >
                            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            <span className="hidden sm:inline">{showForm ? 'Cancel' : 'Create Story'}</span>
                        </button>
                    </div>
                </AdminHeader>

                <div className="p-4 lg:p-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<FileText className="w-5 h-5 text-white" />}
                            iconBg="from-[#63A6B2] to-[#4d8b96]"
                            title="Total Stories"
                            value={stats.totalStories}
                        />
                        <StatCard
                            icon={<FileEdit className="w-5 h-5 text-white" />}
                            iconBg="from-amber-500 to-amber-400"
                            title="Drafts"
                            value={stats.draftCount}
                        />
                        <StatCard
                            icon={<Send className="w-5 h-5 text-white" />}
                            iconBg="from-green-500 to-green-400"
                            title="Published"
                            value={stats.publishedCount}
                        />
                        <StatCard
                            icon={<Calendar className="w-5 h-5 text-white" />}
                            iconBg="from-indigo-500 to-indigo-400"
                            title="Scheduled"
                            value={stats.scheduledCount}
                        />
                    </div>

                    {/* Inline Form */}
                    {showForm && (
                        <div id="story-form" className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                {editingStory ? 'Edit Story' : 'Create New Story'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Story Title *</label>
                                        <input
                                            type="text" name="title" value={formData.title} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter story title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Foundation *</label>
                                        <select
                                            name="foundation_id" value={formData.foundation_id} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                        >
                                            <option value="">Select a foundation</option>
                                            {foundations.map((f) => (
                                                <option key={f.foundation_id} value={f.foundation_id}>{f.foundation_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                                        <input
                                            type="text" 
                                            name="author"
                                            value={formData.author} 
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                            placeholder="Enter author name"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tag Categories</label>
                                        <div className="flex gap-2 items-stretch">
                                            {/* Smart search tag input */}
                                            <div className="relative flex-1" ref={tagDropdownRef}>
                                                {/* Tag chips + type-to-search input */}
                                                <div
                                                    className={`w-full min-h-[48px] px-3 py-2 border rounded-lg bg-white flex flex-wrap gap-1.5 items-center cursor-text transition-all ${
                                                        showTagDropdown
                                                            ? 'border-[#63A6B2] ring-2 ring-[#63A6B2]/20'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    }`}
                                                    onClick={() => { setShowTagDropdown(true); tagInputRef.current?.focus(); }}
                                                >
                                                     {/* Selected tag chips — teal = predefined category, amber = custom new tag */}
                                                    {Array.isArray(formData.tags) && formData.tags.map(tag => {
                                                        const isCustom = !categories.some(cat => cat.name === tag);
                                                        return (
                                                            <span
                                                                key={tag}
                                                                title={isCustom ? 'Custom tag (not in predefined categories)' : 'Predefined category'}
                                                                className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs rounded-full font-medium flex-shrink-0 border ${
                                                                    isCustom
                                                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                        : 'bg-[#63A6B2] text-white border-[#63A6B2]'
                                                                }`}
                                                            >
                                                                {isCustom && (
                                                                    <span className="text-[8px] font-black tracking-wider bg-amber-400 text-white rounded-full px-1 py-0.5 leading-none mr-0.5">NEW</span>
                                                                )}
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                                                                    }}
                                                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                                                        isCustom ? 'bg-amber-200 hover:bg-amber-300 text-amber-700' : 'bg-white/20 hover:bg-white/40 text-white'
                                                                    }`}
                                                                >
                                                                    <X className="w-2.5 h-2.5" />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}

                                                    {/* Search input */}
                                                    <input
                                                        ref={tagInputRef}
                                                        type="text"
                                                        value={tagSearch}
                                                        onChange={(e) => { setTagSearch(e.target.value); setShowTagDropdown(true); }}
                                                        onFocus={() => setShowTagDropdown(true)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const trimmed = tagSearch.trim();
                                                                if (!trimmed) return;
                                                                const isNew = !categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase());
                                                                if (!Array.isArray(formData.tags) || !formData.tags.includes(trimmed)) {
                                                                    setFormData(prev => ({ ...prev, tags: [...(Array.isArray(prev.tags) ? prev.tags : []), trimmed] }));
                                                                }
                                                                if (isNew) saveTagToCategories(trimmed);
                                                                setTagSearch('');
                                                            } else if (e.key === 'Backspace' && tagSearch === '' && Array.isArray(formData.tags) && formData.tags.length > 0) {
                                                                setFormData(prev => ({ ...prev, tags: prev.tags.slice(0, -1) }));
                                                            } else if (e.key === 'Escape') {
                                                                setShowTagDropdown(false);
                                                                setTagSearch('');
                                                            }
                                                        }}
                                                        placeholder={Array.isArray(formData.tags) && formData.tags.length > 0 ? 'Add more...' : 'Search or create a tag...'}
                                                        className="flex-1 min-w-[140px] outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400 py-0.5"
                                                    />

                                                    {/* Chevron toggle */}
                                                    <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={(e) => { e.stopPropagation(); setShowTagDropdown(prev => !prev); }}
                                                        className="ml-auto pl-2"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${showTagDropdown ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Smart dropdown panel */}
                                                {showTagDropdown && (() => {
                                                    const q = tagSearch.trim().toLowerCase();
                                                    const selectedTags = Array.isArray(formData.tags) ? formData.tags : [];

                                                    // 1. Categories that match the query
                                                    const filtered = categories.filter(cat =>
                                                        cat.name.toLowerCase().includes(q)
                                                    );

                                                    // 2. Semantic suggestions (related terms not already in categories)
                                                    const semanticSuggestions = q.length >= 2
                                                        ? getSemanticSuggestions(q, categories, selectedTags)
                                                        : [];

                                                    const exactMatch = categories.some(cat => cat.name.toLowerCase() === q);
                                                    const exactMatchInSemantic = semanticSuggestions.some(s => s.toLowerCase() === q);
                                                    const alreadySelected = q && selectedTags.some(t => t.toLowerCase() === q);
                                                    const showCreateOption = q && !exactMatch && !exactMatchInSemantic && !alreadySelected;
                                                    const hasAnything = filtered.length > 0 || semanticSuggestions.length > 0 || showCreateOption;

                                                    return (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">

                                                            {/* ── Empty state ── */}
                                                            {!hasAnything && (
                                                                <div className="px-4 py-3 text-sm text-gray-400 italic">
                                                                    {categories.length === 0
                                                                        ? 'No categories yet. Type anything and press Enter to create a custom tag.'
                                                                        : q ? 'No matches found. Press Enter to add as a new custom tag.' : 'Start typing to search or create a tag…'}
                                                                </div>
                                                            )}

                                                            {/* ── Create custom tag ── */}
                                                            {showCreateOption && (
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        const trimmed = tagSearch.trim();
                                                                        setFormData(prev => ({ ...prev, tags: [...(Array.isArray(prev.tags) ? prev.tags : []), trimmed] }));
                                                                        saveTagToCategories(trimmed);
                                                                        setTagSearch('');
                                                                    }}
                                                                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-amber-50 transition-colors text-left border-b border-dashed border-amber-200 bg-amber-50/30 sticky top-0 z-10 backdrop-blur-sm"
                                                                >
                                                                    <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
                                                                        <Plus className="w-3 h-3 text-white" />
                                                                    </span>
                                                                    <span className="text-sm font-semibold text-amber-800 flex-1">
                                                                        Create and auto-save &ldquo;<span className="italic">{tagSearch}</span>&rdquo; to Manage Categories
                                                                    </span>
                                                                    <span className="ml-auto text-[10px] text-amber-600 bg-amber-200/50 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                                                                </button>
                                                            )}

                                                            {/* ── Section: Categories ── */}
                                                            {filtered.length > 0 && (
                                                                <>
                                                                    <div className="px-4 py-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 border-b border-gray-100 sticky top-0">
                                                                        📂 Categories
                                                                    </div>
                                                                    {filtered.map(cat => {
                                                                        const isSelected = selectedTags.includes(cat.name);
                                                                        const idx = q ? cat.name.toLowerCase().indexOf(q) : -1;
                                                                        return (
                                                                            <button
                                                                                key={cat.category_id}
                                                                                type="button"
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault();
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        tags: isSelected
                                                                                            ? prev.tags.filter(t => t !== cat.name)
                                                                                            : [...(Array.isArray(prev.tags) ? prev.tags : []), cat.name]
                                                                                    }));
                                                                                    setTagSearch('');
                                                                                }}
                                                                                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left border-b border-gray-100 last:border-0 ${
                                                                                    isSelected ? 'bg-[#63A6B2]/5' : 'hover:bg-gray-50'
                                                                                }`}
                                                                            >
                                                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                                    isSelected ? 'bg-[#63A6B2] border-[#63A6B2]' : 'border-gray-300'
                                                                                }`}>
                                                                                    {isSelected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                                                                                </div>
                                                                                <span className={`text-sm flex-1 ${ isSelected ? 'font-semibold text-[#63A6B2]' : 'text-gray-700' }`}>
                                                                                    {q && idx >= 0
                                                                                        ? <>
                                                                                            {cat.name.slice(0, idx)}
                                                                                            <span className="bg-yellow-100 text-yellow-800 rounded px-0.5 font-semibold">{cat.name.slice(idx, idx + q.length)}</span>
                                                                                            {cat.name.slice(idx + q.length)}
                                                                                          </>
                                                                                        : cat.name
                                                                                    }
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </>
                                                            )}

                                                            {/* ── Section: Smart Suggestions ── */}
                                                            {semanticSuggestions.length > 0 && (
                                                                <>
                                                                    <div className="px-4 py-1.5 text-[10px] text-purple-500 font-bold uppercase tracking-widest bg-purple-50 border-b border-purple-100 border-t border-t-gray-100 sticky top-0">
                                                                        ✨ Suggested for "{tagSearch}"
                                                                    </div>
                                                                    {semanticSuggestions.map(suggestion => {
                                                                        const isSelected = selectedTags.includes(suggestion);
                                                                        return (
                                                                            <button
                                                                                key={suggestion}
                                                                                type="button"
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault();
                                                                                    if (!isSelected) {
                                                                                        setFormData(prev => ({
                                                                                            ...prev,
                                                                                            tags: [...(Array.isArray(prev.tags) ? prev.tags : []), suggestion]
                                                                                        }));
                                                                                    }
                                                                                    setTagSearch('');
                                                                                }}
                                                                                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left border-b border-purple-50 last:border-0 ${
                                                                                    isSelected ? 'bg-purple-50/60' : 'hover:bg-purple-50'
                                                                                }`}
                                                                            >
                                                                                <span className="w-4 h-4 rounded-full border-2 border-dashed border-purple-300 flex items-center justify-center flex-shrink-0">
                                                                                    {isSelected && <span className="text-purple-500 text-[10px] font-bold leading-none">✓</span>}
                                                                                </span>
                                                                                <span className={`text-sm flex-1 ${ isSelected ? 'line-through text-gray-400' : 'text-purple-700' }`}>
                                                                                    {suggestion}
                                                                                </span>
                                                                                {!isSelected && (
                                                                                    <span className="text-[10px] text-purple-400 font-semibold bg-purple-100 px-1.5 py-0.5 rounded-full">suggest</span>
                                                                                )}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Manage Categories button */}
                                            <button
                                                type="button"
                                                onClick={() => setIsManagingCategories(true)}
                                                className="bg-[#63A6B2] text-white border border-[#63A6B2] px-4 py-2 rounded-lg font-semibold hover:bg-[#4d8b96] transition flex items-center justify-center shadow-sm text-base w-44 whitespace-nowrap"
                                            >
                                                Manage Categories
                                            </button>
                                        </div>
                                        {/* Helper hint */}
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            Type to search • Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd> or click a suggestion to add • <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Backspace</kbd> removes last tag
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:border-[#63A6B2] focus-within:ring-[#63A6B2]/20 transition-all">
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.content}
                                            onChange={(value) => setFormData({ ...formData, content: value })}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Enter full story content"
                                            className="h-64 mb-12 custom-quill" // Height requires custom-quill handling or padding
                                        />
                                    </div>
                                </div>

                                {/* Story Image */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Story Images (Carousel)</label>
                                    <div className="flex flex-col gap-4">
                                        {/* Image Previews */}
                                        <div className="flex flex-wrap gap-4">
                                            {/* Existing Images */}
                                            {existingImages.filter(img => keepExistingImages.includes(img.image_id)).map((img) => (
                                                <div key={img.image_id} className="h-40 w-40 rounded-lg border-2 border-gray-200 overflow-hidden relative shadow-sm group">
                                                    <img src={`http://localhost:5000${img.image_file}`} alt="Existing" className="h-full w-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeExistingImage(img.image_id)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] py-0.5 text-center">Existing</div>
                                                </div>
                                            ))}

                                            {/* New Image Previews */}
                                            {imagePreviewUrls.map((url, index) => (
                                                <div key={index} className="h-40 w-40 rounded-lg border-2 border-[#63A6B2] overflow-hidden relative shadow-sm group">
                                                    <img src={url} alt="New Preview" className="h-full w-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeNewImage(index)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-[#63A6B2]/80 text-white text-[10px] py-0.5 text-center">New</div>
                                                </div>
                                            ))}

                                            {(keepExistingImages.length + selectedImages.length) === 0 && (
                                                <div className="h-40 w-40 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-[10px] text-gray-400 text-center px-2">No images selected</p>
                                                </div>
                                            )}
                                        </div>

                                        <label className="cursor-pointer max-w-sm w-full block">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#63A6B2] transition text-center bg-gray-50/50">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm font-medium text-gray-700">Click to add images</p>
                                                <p className="text-xs text-gray-500 mt-1">Single or multiple files allowed</p>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" multiple />
                                        </label>
                                    </div>
                                </div>

                                 {/* Publishing Options */}
                                 <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                        <Send className="w-4 h-4 text-[#63A6B2]" />
                                        Publishing Options
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPublishMode('draft');
                                                setFormData({ ...formData, is_published: false, scheduled_publish_at: '' });
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1
                                                ${publishMode === 'draft' 
                                                    ? 'border-[#63A6B2] bg-[#63A6B2]/5 ring-4 ring-[#63A6B2]/10' 
                                                    : 'border-white bg-white hover:border-gray-200 shadow-sm'}`}
                                        >
                                            <span className={`text-sm font-bold ${publishMode === 'draft' ? 'text-[#63A6B2]' : 'text-gray-900'}`}>Draft</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Save for later</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPublishMode('now');
                                                setFormData({ ...formData, is_published: true, scheduled_publish_at: '' });
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1
                                                ${publishMode === 'now' 
                                                    ? 'border-green-500 bg-green-50 ring-4 ring-green-100' 
                                                    : 'border-white bg-white hover:border-gray-200 shadow-sm'}`}
                                        >
                                            <span className={`text-sm font-bold ${publishMode === 'now' ? 'text-green-600' : 'text-gray-900'}`}>Publish Now</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Instant visibility</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPublishMode('scheduled');
                                                setFormData({ ...formData, is_published: false });
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1
                                                ${publishMode === 'scheduled' 
                                                    ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' 
                                                    : 'border-white bg-white hover:border-gray-200 shadow-sm'}`}
                                        >
                                            <span className={`text-sm font-bold ${publishMode === 'scheduled' ? 'text-indigo-600' : 'text-gray-900'}`}>Schedule</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Set a target time</span>
                                        </button>
                                    </div>

                                    {publishMode === 'scheduled' && (
                                        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Scheduled Publish Date & Time</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                                <input
                                                    type="datetime-local"
                                                    name="scheduled_publish_at"
                                                    value={formData.scheduled_publish_at}
                                                    onChange={handleChange}
                                                    required={publishMode === 'scheduled'}
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-900 shadow-sm"
                                                />
                                            </div>
                                            <p className="mt-2 text-[10px] text-indigo-500 italic px-1 font-medium flex items-center gap-1.5">
                                                <AlertTriangle className="w-3 h-3" />
                                                Story will be automatically published at the selected time.
                                            </p>
                                        </div>
                                    )}
                                 </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit" disabled={isLoading}
                                        className="flex-1 bg-[#63A6B2] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4d8b96] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : (editingStory ? 'Update Story' : 'Save as Draft')}
                                    </button>
                                    <button
                                        type="button" onClick={resetForm}
                                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Draft / Published Tabs */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('draft')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                                    ${activeTab === 'draft'
                                        ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <FileEdit className="w-4 h-4" />
                                Drafts
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {draftStories.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('publish')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                                    ${activeTab === 'publish'
                                        ? 'text-green-600 border-b-2 border-green-500 bg-green-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                Published
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === 'publish' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {publishedStories.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('scheduled')}
                                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2
                                    ${activeTab === 'scheduled'
                                        ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Scheduled
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                                    ${activeTab === 'scheduled' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {scheduledStories.length}
                                </span>
                            </button>
                        </div>

                        {/* Search & Sort inside tab panel */}
                        <div className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" placeholder="Search stories..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                        className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2] focus:ring-2 focus:ring-[#63A6B2]/20 appearance-none bg-white cursor-pointer"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-gray-900">{filteredStories.length}</span>{' '}
                                    {activeTab === 'draft' ? 'draft' : 'published'} stor{filteredStories.length !== 1 ? 'y' : 'ies'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stories Grid */}
                    {filteredStories.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            {activeTab === 'draft' ? (
                                <FileEdit className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            ) : (
                                <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            )}
                            <p className="text-gray-500 font-semibold text-lg">
                                No {activeTab === 'draft' ? 'draft' : 'published'} stories
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                {activeTab === 'draft'
                                    ? 'Create a new story to get started — it will appear here as a draft.'
                                    : 'Publish a draft story to make it visible to the public.'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                            <th className="px-6 py-4">Story Title</th>
                                            <th className="px-6 py-4">Foundation</th>
                                            <th className="px-6 py-4">Author</th>
                                            <th className="px-6 py-4">Images</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="pl-16 pr-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredStories.map((story) => {
                                            return (
                                                <tr key={story.story_id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                                {story.images && story.images.length > 0 ? (
                                                                    <img 
                                                                        src={`http://localhost:5000${story.images[0].image_file}`} 
                                                                        alt="Preview" 
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] xl:max-w-[300px]">{story.title}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#63A6B2]/10 text-[#63A6B2]">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate max-w-[150px]">{story.foundation_name || 'None'}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600 font-medium">
                                                            {story.author || <span className="text-gray-400 italic">Anonymous</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                                            {story.images?.length || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{formatDate(story.created_at)}</span>
                                                    </td>
                                                    <td className="pl-16 pr-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setStatusModalStory(story);
                                                                    setStatusModalValue(
                                                                        story.is_published ? 'publish'
                                                                        : story.scheduled_publish_at ? 'schedule'
                                                                        : 'draft'
                                                                    );
                                                                    setStatusModalScheduleDate(
                                                                        story.scheduled_publish_at
                                                                            ? story.scheduled_publish_at.slice(0, 16)
                                                                            : ''
                                                                    );
                                                                    setShowStatusModal(true);
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-75 active:scale-95 whitespace-nowrap ${
                                                                    story.is_published
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : story.scheduled_publish_at
                                                                        ? 'bg-indigo-100 text-indigo-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {story.is_published ? '✅ Publish' : story.scheduled_publish_at ? '🕐 Schedule' : '📝 Draft'}
                                                            </button>
                                                            {story.scheduled_publish_at && !story.is_published && (
                                                                <span className="text-[11px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-md whitespace-nowrap">
                                                                    {new Date(story.scheduled_publish_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => { setViewingStory(story); setShowViewModal(true); setCurrentImageIndex(0); }}
                                                                className="p-1.5 text-gray-400 hover:text-[#63A6B2] transition tooltip"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(story)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-500 transition tooltip"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(story.story_id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 transition tooltip"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Status Change Modal */}
            {showStatusModal && statusModalStory && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900">Change Story Status</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-6 truncate">"{statusModalStory.title}"</p>

                        {/* 3 option cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setStatusModalValue('draft')}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                                    statusModalValue === 'draft'
                                        ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                                }`}
                            >
                                <FileEdit className={`w-5 h-5 mb-1 ${statusModalValue === 'draft' ? 'text-amber-500' : 'text-gray-400'}`} />
                                <span className={`text-sm font-bold ${statusModalValue === 'draft' ? 'text-amber-700' : 'text-gray-900'}`}>Draft</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Save for later</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusModalValue('publish')}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                                    statusModalValue === 'publish'
                                        ? 'border-green-500 bg-green-50 ring-4 ring-green-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                                }`}
                            >
                                <Send className={`w-5 h-5 mb-1 ${statusModalValue === 'publish' ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className={`text-sm font-bold ${statusModalValue === 'publish' ? 'text-green-700' : 'text-gray-900'}`}>Publish</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Instant</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusModalValue('schedule')}
                                className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-1 ${
                                    statusModalValue === 'schedule'
                                        ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100'
                                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                                }`}
                            >
                                <Calendar className={`w-5 h-5 mb-1 ${statusModalValue === 'schedule' ? 'text-indigo-500' : 'text-gray-400'}`} />
                                <span className={`text-sm font-bold ${statusModalValue === 'schedule' ? 'text-indigo-700' : 'text-gray-900'}`}>Schedule</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Set a time</span>
                            </button>
                        </div>

                        {/* Schedule datetime picker */}
                        {statusModalValue === 'schedule' && (
                            <div className="mb-6">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Scheduled Date & Time</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={statusModalScheduleDate}
                                        onChange={(e) => setStatusModalScheduleDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-900 shadow-sm"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-indigo-400 italic font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Story will auto-publish at this time.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusModalConfirm}
                                className="flex-1 px-4 py-2.5 bg-[#63A6B2] text-white rounded-lg font-semibold hover:bg-[#4d8b96] transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Management Modal */}
            {isManagingCategories && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Manage Story Categories</h3>
                            <button onClick={() => { setIsManagingCategories(false); setEditingCategory(null); setNewCategoryName(''); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder={editingCategory ? "Edit category name" : "New category name"}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#63A6B2]"
                                />
                                <button 
                                    onClick={() => editingCategory ? handleUpdateCategory(editingCategory.category_id) : handleAddCategory()}
                                    className="bg-[#63A6B2] text-white px-4 py-2 rounded-lg font-bold"
                                >
                                    {editingCategory ? 'Update' : 'Add'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {categories.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4">No categories created yet.</p>
                                ) : (
                                    categories.map(cat => (
                                        <div key={cat.category_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); }}
                                                    className="p-1.5 text-blue-500 hover:bg-white rounded shadow-sm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setCategoryToDelete(cat)}
                                                    className="p-1.5 text-red-500 hover:bg-white rounded shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Delete Confirmation Modal (Nested) */}
                    {categoryToDelete && (
                        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Category</h3>
                                <p className="text-gray-600 mb-6 font-medium">
                                    Are you sure you want to delete <span className="text-red-500">&ldquo;{categoryToDelete.name}&rdquo;</span>? This will remove it as an option.
                                </p>
                                <div className="flex justify-end gap-3 font-semibold">
                                    <button
                                        onClick={() => setCategoryToDelete(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(categoryToDelete.category_id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* View Story Modal */}
            {showViewModal && viewingStory && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-[#f8fafc] rounded-[2rem] max-w-5xl w-full shadow-2xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                        
                        {/* Story Carousel Section (Mirrors public StoryDetails) */}
                        <div 
                            className="relative h-[400px] md:h-[500px] w-full bg-gray-900 overflow-hidden group shrink-0"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            <button 
                                onClick={() => { setShowViewModal(false); setViewingStory(null); setCurrentImageIndex(0); }}
                                className="absolute top-6 right-6 z-30 bg-white/10 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all shadow-xl active:scale-95 group-hover:scale-110"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {viewingStory.images && viewingStory.images.length > 0 ? (
                                <>
                                    {/* Blurred Background Layer */}
                                    <div className="absolute inset-0 scale-110 blur-3xl opacity-40 transition-opacity duration-1000">
                                        <img 
                                            src={`http://localhost:5000${viewingStory.images[currentImageIndex].image_file}`} 
                                            alt="Blurred Backdrop" 
                                            className="w-full h-full object-cover" 
                                        />
                                    </div>

                                    {/* Main Image */}
                                    <img 
                                        src={`http://localhost:5000${viewingStory.images[currentImageIndex].image_file}`} 
                                        alt={viewingStory.title} 
                                        className="relative z-10 w-full h-full object-contain transition-all duration-700 ease-in-out py-8" 
                                    />

                                    {viewingStory.images.length > 1 && (
                                        <>
                                            {/* Glassmorphism Navigation Buttons */}
                                            <button 
                                                onClick={() => { setCurrentImageIndex(prev => (prev - 1 + viewingStory.images.length) % viewingStory.images.length); setProgress(0); }}
                                                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button 
                                                onClick={() => { setCurrentImageIndex(prev => (prev + 1) % viewingStory.images.length); setProgress(0); }}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-md text-white p-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:scale-110 active:scale-95 flex items-center justify-center shadow-2xl"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>

                                            {/* Modern Indicator Dots */}
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
                                                {viewingStory.images.map((_, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => { setCurrentImageIndex(idx); setProgress(0); }}
                                                        className={`h-2 rounded-full shadow-lg transition-all duration-500 ${idx === currentImageIndex ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} 
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                    <ImageIcon className="w-20 h-20 text-gray-700" />
                                </div>
                            )}

                            {/* Gradient overlay at bottom for smoother transition */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent z-10 pointer-events-none" />
                        </div>
                        
                        {/* Scrollable Content Area */}
                        <div className="p-4 md:p-8 overflow-y-auto flex-1 space-y-8 scrollbar-hide pb-20">
                            
                            {/* Meta Card (Redesigned to match StoryDetails) */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 p-8 transform -mt-16 relative z-20 max-w-4xl mx-auto">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <p className="text-[10px] font-black text-[#63A6B2] uppercase tracking-[0.2em]">Story Preview</p>
                                            {!viewingStory.is_published ? (
                                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-amber-200 bg-amber-50 text-amber-600">Draft</span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border border-green-200 bg-green-50 text-green-600">Published</span>
                                            )}
                                        </div>
                                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                                            {viewingStory.title}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-4 text-[#63A6B2] font-bold text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{viewingStory.foundation_name || 'General Operations'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 text-left md:text-right shrink-0">
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Published Date</p>
                                            <p className="text-gray-900 font-extrabold text-sm">
                                                {new Date(viewingStory.published_at || viewingStory.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {viewingStory.author && (
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Written By</p>
                                                <div className="flex items-center md:justify-end gap-2">
                                                    <span className="text-[#63A6B2] font-extrabold text-sm">{viewingStory.author}</span>
                                                    <div className="w-6 h-6 rounded-full bg-[#63A6B2]/10 flex items-center justify-center">
                                                        <UserCog className="w-3.5 h-3.5 text-[#63A6B2]" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Story Content Card */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 p-8 md:p-12 max-w-4xl mx-auto">
                                <div 
                                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed ql-editor" 
                                    style={{ padding: 0 }} 
                                    dangerouslySetInnerHTML={{ __html: viewingStory.content || '<p class="text-gray-400 italic">No content available for this story.</p>' }} 
                                />
                            </div>

                            {/* Tags Section */}
                            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white p-6 max-w-4xl mx-auto">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Discovery Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {viewingStory.tags ? viewingStory.tags.split(',').map((tag, idx) => (
                                        <span 
                                            key={idx} 
                                            className="bg-white text-gray-600 px-4 py-2 rounded-xl text-xs font-bold border border-gray-100 shadow-sm hover:border-[#63A6B2]/30 transition-colors"
                                        >
                                            #{tag.trim()}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-gray-400 italic">No tags assigned</span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Close Reading Action */}
                            <div className="flex justify-center pb-8">
                                <button
                                    onClick={() => { setShowViewModal(false); setViewingStory(null); setCurrentImageIndex(0); }}
                                    className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-10 py-4 rounded-full font-black text-sm hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                                >
                                    Done Reading
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Story</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete this story? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteModal(false); setStoryToDelete(null); }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({ icon, iconBg, title, value }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">{title}</p>
                    <p className={`text-xl font-bold text-gray-900 truncate`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

// Story Card Component
function StoryCard({ story, onEdit, onDelete, onView, onToggleStatus, formatDate }) {
    const [showMenu, setShowMenu] = useState(false);
    const isDraft = !story.is_published;

    return (
        <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group
            ${isDraft ? 'border-amber-200' : 'border-gray-200'}`}
        >
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-[#63A6B2] to-[#4d8b96] overflow-hidden">
                {story.images && story.images.length > 0 ? (
                    <img
                        src={`http://localhost:5000${story.images[0].image_file}`}
                        alt={story.title}
                        className={`w-full h-full object-cover ${isDraft ? 'opacity-80' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-white/30" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    {isDraft ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                            <FileEdit className="w-3 h-3" />
                            Draft
                        </span>
                    ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white flex items-center gap-1 shadow-sm">
                            <Eye className="w-3 h-3" />
                            Published
                        </span>
                    )}
                </div>

                {/* Multiple Images Indicator */}
                {story.images && story.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {story.images.length}
                    </div>
                )}

                {/* More Menu */}
                <div className="absolute top-3 right-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-700" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                                    <button
                                        onClick={() => { setViewingStory(story); setShowViewModal(true); setCurrentImageIndex(0); setProgress(0); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    <button
                                        onClick={() => { onEdit(story); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                        onClick={() => { onDelete(story.story_id); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-[#63A6B2] font-semibold mb-2 bg-[#63A6B2]/10 w-fit px-2 py-1 rounded">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{story.foundation_name || 'No foundation'}</span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight">{story.title}</h3>
                {story.subtitle && (
                    <p className="text-sm font-semibold text-[#63A6B2] mb-2 line-clamp-1">{story.subtitle}</p>
                )}

                {story.content && (
                    <div className="prose prose-sm max-w-none text-gray-500 mb-4 line-clamp-2 overflow-hidden ql-editor" style={{ padding: 0 }} dangerouslySetInnerHTML={{ __html: story.content }} />
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4 mt-auto">
                   {story.author ? (
                       <div className="flex items-center gap-1.5">
                           <UserCog className="w-3.5 h-3.5" />
                           <span className="truncate max-w-[100px]">{story.author}</span>
                       </div>
                   ) : (
                       <div></div>
                   )}
                   <div className="flex items-center gap-1.5">
                       <Calendar className="w-3.5 h-3.5" />
                       <span>{formatDate(story.created_at)}</span>
                   </div>
                </div>

                {/* Publish / Unpublish Button */}
                <button
                    onClick={() => onToggleStatus(story.story_id, story.is_published)}
                    className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                        ${isDraft
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                >
                    {isDraft ? <Send className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {isDraft ? 'Publish Story' : 'Unpublish Story'}
                </button>
            </div>
        </div>
    );
}
