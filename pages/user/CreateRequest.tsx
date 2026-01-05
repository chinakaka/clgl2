import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestType, Urgency, User, Traveler, UserProfile } from '../../types';
import { api } from '../../services/api';
import { Plane, Building, Car, Bus, ArrowLeft, Check, ChevronRight, UserPlus, Trash2, User as UserIcon, HelpCircle, BookUser, Search, Loader2, Tag, ArrowRight, MapPin, Star, Calendar, Users, ThumbsUp } from 'lucide-react';

interface CreateRequestProps {
  user: User;
}

interface FlightSearchResult {
  flights: {
    airline: string;
    flight_number: string;
    departure_airport: { id: string; time: string };
    arrival_airport: { id: string; time: string };
    duration: number;
    airline_logo?: string;
  }[];
  price: number;
  total_duration: number;
}

interface HotelSearchResult {
  name: string;
  overall_rating?: number;
  reviews?: number;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  thumbnail?: string;
  description?: string;
  amenities?: string[];
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Common City to IATA Code Mapping
const CITY_CODES: Record<string, string> = {
  // China
  '北京': 'BJS', 'BEIJING': 'BJS', 'PEK': 'PEK', 'PKX': 'PKX',
  '上海': 'SHA', 'SHANGHAI': 'SHA', 'PVG': 'PVG',
  '广州': 'CAN', 'GUANGZHOU': 'CAN',
  '深圳': 'SZX', 'SHENZHEN': 'SZX',
  '成都': 'CTU', 'CHENGDU': 'CTU', 'TFU': 'TFU',
  '杭州': 'HGH', 'HANGZHOU': 'HGH',
  '昆明': 'KMG', 'KUNMING': 'KMG',
  '西安': 'XIY', 'XIAN': 'XIY',
  '重庆': 'CKG', 'CHONGQING': 'CKG',
  '武汉': 'WUH', 'WUHAN': 'WUH',
  '长沙': 'CSX', 'CHANGSHA': 'CSX',
  '南京': 'NKG', 'NANJING': 'NKG',
  '厦门': 'XMN', 'XIAMEN': 'XMN',
  '青岛': 'TAO', 'QINGDAO': 'TAO',
  '大连': 'DLC', 'DALIAN': 'DLC',
  '天津': 'TSN', 'TIANJIN': 'TSN',
  '三亚': 'SYX', 'SANYA': 'SYX',
  '海口': 'HAK', 'HAIKOU': 'HAK',
  '乌鲁木齐': 'URC', 'URUMQI': 'URC',
  '哈尔滨': 'HRB', 'HARBIN': 'HRB',
  '沈阳': 'SHE', 'SHENYANG': 'SHE',
  '长春': 'CGQ', 'CHANGCHUN': 'CGQ',
  '兰州': 'LHW', 'LANZHOU': 'LHW',
  '贵阳': 'KWE', 'GUIYANG': 'KWE',
  '南宁': 'NNG', 'NANNING': 'NNG',
  '福州': 'FOC', 'FUZHOU': 'FOC',
  '太原': 'TYN', 'TAIYUAN': 'TYN',
  '济南': 'TNA', 'JINAN': 'TNA',
  '合肥': 'HFE', 'HEFEI': 'HFE',
  '石家庄': 'SJW', 'SHIJIAZHUANG': 'SJW',
  '南昌': 'KHN', 'NANCHANG': 'KHN',
  '郑州': 'CGO', 'ZHENGZHOU': 'CGO',
  '香港': 'HKG', 'HONGKONG': 'HKG',
  '澳门': 'MFM', 'MACAU': 'MFM',
  '台北': 'TPE', 'TAIPEI': 'TPE', 'TSA': 'TSA',

  // International
  '东京': 'TYO', 'TOKYO': 'TYO', 'HND': 'HND', 'NRT': 'NRT',
  '大阪': 'OSA', 'OSAKA': 'OSA', 'KIX': 'KIX',
  '首尔': 'SEL', 'SEOUL': 'SEL', 'ICN': 'ICN', 'GMP': 'GMP',
  '新加坡': 'SIN', 'SINGAPORE': 'SIN',
  '曼谷': 'BKK', 'BANGKOK': 'BKK', 'DMK': 'DMK',
  '伦敦': 'LON', 'LONDON': 'LON', 'LHR': 'LHR',
  '纽约': 'NYC', 'NEWYORK': 'NYC', 'JFK': 'JFK', 'EWR': 'EWR',
  '巴黎': 'PAR', 'PARIS': 'PAR', 'CDG': 'CDG',
  '洛杉矶': 'LAX', 'LOSANGELES': 'LAX',
  '旧金山': 'SFO', 'SANFRANCISCO': 'SFO',
  '迪拜': 'DXB', 'DUBAI': 'DXB',
  '悉尼': 'SYD', 'SYDNEY': 'SYD',
};

const getAirportCode = (input: string): string => {
  if (!input) return '';
  const cleanInput = input.trim().toUpperCase();
  // 1. Direct match in map (Chinese or English Key)
  if (CITY_CODES[input.trim()]) return CITY_CODES[input.trim()];
  if (CITY_CODES[cleanInput]) return CITY_CODES[cleanInput];

  // 2. Already an IATA code (3 letters)
  if (/^[A-Z]{3}$/.test(cleanInput)) return cleanInput;

  // 3. Fallback to original
  return input;
};

// Helper for Hotel Rating Badge
const getRatingBadge = (rating: number) => {
  if (rating >= 4.5) return { label: '超棒', color: 'bg-blue-600' };
  if (rating >= 4.0) return { label: '很好', color: 'bg-blue-500' };
  if (rating >= 3.5) return { label: '不错', color: 'bg-blue-400' };
  return { label: '一般', color: 'bg-gray-400' };
};

const CreateRequest: React.FC<CreateRequestProps> = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Flight Search State
  const [isSearching, setIsSearching] = useState(false);
  const [flightResults, setFlightResults] = useState<FlightSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Hotel Search State
  const [hotelResults, setHotelResults] = useState<HotelSearchResult[]>([]);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [showHotelResults, setShowHotelResults] = useState(false);
  const [hotelKeywords, setHotelKeywords] = useState(''); // Extra search term

  // Form State
  const [baseData, setBaseData] = useState({
    purpose: '',
    urgency: Urgency.NORMAL,
    budgetCap: '',
    notes: '',
  });

  const [travelers, setTravelers] = useState<Traveler[]>([
    { name: '', idType: '身份证', idNumber: '', idExpiryDate: '', phone: '' }
  ]);

  // Initialize with defaults
  const [formData, setFormData] = useState<any>({
    tripType: 'ONE_WAY',
    cabinClass: 'ECONOMY'
  });

  // Load profile for contacts
  useEffect(() => {
    api.getUserProfile(user.id).then(setUserProfile);
  }, [user.id]);
  // ... (lines 158-196 skipped for brevity)
  const addTraveler = () => {
    setTravelers([...travelers, { name: '', idType: '身份证', idNumber: '', idExpiryDate: '', phone: '' }]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length === 1) return;
    const newTravelers = [...travelers];
    newTravelers.splice(index, 1);
    setTravelers(newTravelers);
  };

  const updateTraveler = (index: number, field: keyof Traveler, value: string) => {
    const newTravelers = [...travelers];
    newTravelers[index] = { ...newTravelers[index], [field]: value };
    setTravelers(newTravelers);
  };

  const loadSelfProfile = async (index: number) => {
    if (!userProfile) return;
    const mainDoc = userProfile.documents.find(d => d.type === '身份证') || userProfile.documents[0];

    const newTravelers = [...travelers];
    newTravelers[index] = {
      name: userProfile.chineseName,
      idType: mainDoc?.type || '身份证',
      idNumber: mainDoc?.number || '',
      idExpiryDate: mainDoc?.expiryDate || '',
      phone: userProfile.phone || ''
    };
    setTravelers(newTravelers);
  };

  const loadContact = (index: number, contactIndex: string) => {
    if (!userProfile || !userProfile.contacts) return;
    const contact = userProfile.contacts[parseInt(contactIndex)];
    if (!contact) return;

    const newTravelers = [...travelers];
    newTravelers[index] = {
      name: contact.name,
      idType: contact.idType,
      idNumber: contact.idNumber,
      idExpiryDate: contact.idExpiryDate || '',
      phone: contact.phone
    };
    setTravelers(newTravelers);
  };

  // --- Flight Search Logic ---
  const handleSearchFlights = async () => {
    const { departureCity, arrivalCity, departureDate, returnDate, tripType } = formData;

    if (!departureCity || !arrivalCity || !departureDate) {
      alert("请输入出发城市、到达城市和出发日期");
      return;
    }

    const depCode = getAirportCode(departureCity);
    const arrCode = getAirportCode(arrivalCity);

    // Validate codes: Must be 3 letter IATA code
    if (!/^[A-Z]{3}$/.test(depCode)) {
      alert(`无法识别出发城市 "${departureCity}"。API 需要三字码 (如 PEK)，请尝试直接输入机场代码。`);
      return;
    }
    if (!/^[A-Z]{3}$/.test(arrCode)) {
      alert(`无法识别到达城市 "${arrivalCity}"。API 需要三字码 (如 SHA)，请尝试直接输入机场代码。`);
      return;
    }

    // Validate Return Date for Round Trip
    if (tripType === 'ROUND_TRIP' && !returnDate) {
      alert("往返行程必须选择返程日期");
      return;
    }

    setIsSearching(true);
    setFlightResults([]);
    setShowResults(true);

    // Map parameters for SerpApi
    let searchType = '2';
    if (tripType === 'ROUND_TRIP' && returnDate) {
      searchType = '1';
    }

    let travelClass = '1';
    if (formData.cabinClass === 'BUSINESS') travelClass = '3';
    if (formData.cabinClass === 'FIRST') travelClass = '4';

    try {
      const params = new URLSearchParams({
        engine: 'google_flights',
        departure_id: depCode,
        arrival_id: arrCode,
        outbound_date: departureDate,
        currency: 'CNY',
        hl: 'zh-cn',
        api_key: 'e9a693e55e190750cd8b8d5db3686c0f4ea7b761cf4e7612b4d8a5a5259332aa',
        type: searchType,
        travel_class: travelClass
      });

      if (searchType === '1') {
        params.append('return_date', returnDate);
      }

      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://serpapi.com/search?' + params.toString())}`);
      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        if (data.error.includes('departure_id') || data.error.includes('arrival_id')) {
          alert(`城市无法识别，请输入机场三字码 (例如: 北京->PEK, 上海->SHA)`);
        } else {
          alert(`查询出错: ${data.error}`);
        }
        return;
      }

      const best = data.best_flights || [];
      const other = data.other_flights || [];
      setFlightResults([...best, ...other]);

    } catch (e) {
      console.error(e);
      alert("无法连接到价格查询服务，请检查网络或稍后重试。");
    } finally {
      setIsSearching(false);
    }
  };

  const selectFlight = (flight: FlightSearchResult) => {
    const mainSegment = flight.flights[0];
    const airline = mainSegment.airline;
    const flightNum = mainSegment.flight_number;

    setFormData((prev: any) => ({
      ...prev,
      airlinePreference: airline,
      flightNumber: flightNum
    }));

    setBaseData(prev => ({
      ...prev,
      budgetCap: flight.price.toString()
    }));

    setShowResults(false);
  };

  // --- Hotel Search Logic ---
  const handleSearchHotels = async () => {
    const { city, checkInDate, checkOutDate, guestCount } = formData;

    if (!city || !checkInDate || !checkOutDate) {
      alert("请输入城市、入住日期和退房日期");
      return;
    }

    setIsSearchingHotels(true);
    setHotelResults([]);
    setShowHotelResults(true);

    try {
      const query = hotelKeywords ? `${city} ${hotelKeywords}` : city;

      const params = new URLSearchParams({
        engine: 'google_hotels',
        q: query.includes('酒店') || query.includes('hotel') ? query : `hotels in ${query}`,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults: guestCount ? String(guestCount) : '1',
        currency: 'CNY',
        gl: 'cn',
        hl: 'zh-cn',
        api_key: 'e9a693e55e190750cd8b8d5db3686c0f4ea7b761cf4e7612b4d8a5a5259332aa'
      });

      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://serpapi.com/search?' + params.toString())}`);
      const data = await response.json();

      if (data.error) {
        console.error(data.error);
        alert(`查询出错: ${data.error}`);
        return;
      }

      const properties = data.properties || [];
      setHotelResults(properties);

    } catch (e) {
      console.error(e);
      alert("无法连接到酒店查询服务，请检查网络或稍后重试。");
    } finally {
      setIsSearchingHotels(false);
    }
  };

  const selectHotel = (hotel: HotelSearchResult) => {
    // Determine Star Rating based on user rating if available
    let starRating = formData.starRating;
    if (hotel.overall_rating) {
      if (hotel.overall_rating >= 4.5) starRating = '5 Star';
      else if (hotel.overall_rating >= 4.0) starRating = '4 Star';
      else if (hotel.overall_rating >= 3.0) starRating = '3 Star';
    }

    // Set Budget
    const price = hotel.rate_per_night?.extracted_lowest?.toString() || '';
    if (price) {
      setBaseData(prev => ({
        ...prev,
        budgetCap: price
      }));
    }

    // Set Location Preference (Hotel Name)
    setFormData((prev: any) => ({
      ...prev,
      locationPreference: hotel.name,
      starRating: starRating,
      roomType: prev.roomType || '标准房/Run of House' // Default room type if empty
    }));

    setShowHotelResults(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    const invalidTraveler = travelers.find(t => !t.name || !t.idNumber || !t.phone);
    if (invalidTraveler) {
      alert('请完善所有出行人的姓名、证件号和手机号');
      return;
    }

    setLoading(true);

    try {
      const finalData = {
        ...baseData,
        ...formData,
        budgetCap: baseData.budgetCap ? parseFloat(baseData.budgetCap) : undefined,
        travelers: travelers
      };

      await api.createRequest(user, selectedType, finalData);
      navigate('/user/dashboard');
    } catch (err) {
      console.error(err);
      alert('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const renderScenarioForm = () => {
    switch (selectedType) {
      case RequestType.FLIGHT:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">行程类型</label>
                <select name="tripType" value={formData.tripType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required>
                  <option value="ONE_WAY">单程</option>
                  <option value="ROUND_TRIP">往返</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">舱位要求</label>
                <select name="cabinClass" value={formData.cabinClass} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required>
                  <option value="ECONOMY">经济舱</option>
                  <option value="BUSINESS">公务舱</option>
                  <option value="FIRST">头等舱</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">出发城市</label>
                <input type="text" name="departureCity" value={formData.departureCity || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="城市名(如:北京) 或 机场代码(如:PEK)" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">到达城市</label>
                <input type="text" name="arrivalCity" value={formData.arrivalCity || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="城市名(如:上海) 或 机场代码(如:SHA)" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">出发日期</label>
                <input type="date" name="departureDate" value={formData.departureDate || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
              </div>
              {formData.tripType === 'ROUND_TRIP' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">返程日期 <span className="text-red-500">*</span></label>
                  <input type="date" name="returnDate" value={formData.returnDate || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
                </div>
              )}
            </div>

            {/* Price Check Button */}
            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div className="text-sm text-indigo-800">
                <span className="font-bold">想知道大约多少钱？</span>
                <span className="ml-1 opacity-80">输入城市和日期后查询实时票价参考。</span>
              </div>
              <button
                type="button"
                onClick={handleSearchFlights}
                disabled={isSearching}
                className="flex items-center bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                {isSearching ? '查询中...' : '查询实时票价'}
              </button>
            </div>

            {/* Flight Results */}
            {showResults && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-inner">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="font-bold text-gray-700 text-sm">查询结果参考 (点击可填入)</h4>
                  <button type="button" onClick={() => setShowResults(false)} className="text-xs text-gray-500 hover:text-gray-900">收起</button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {flightResults.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      {isSearching ? '正在连接全球航班数据...' : '未找到符合条件的航班，请检查输入或尝试其他日期。'}
                    </div>
                  ) : (
                    flightResults.map((flight, idx) => {
                      const firstLeg = flight.flights[0];
                      const lastLeg = flight.flights[flight.flights.length - 1];
                      return (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => selectFlight(flight)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <img src={firstLeg.airline_logo} alt="logo" className="w-5 h-5 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                              <span className="font-bold text-gray-900 text-sm">{firstLeg.airline}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{firstLeg.flight_number}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 gap-2">
                              <span>{firstLeg.departure_airport.time.split(' ')[1]}</span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span>{lastLeg.arrival_airport.time.split(' ')[1]}</span>
                              <span className="text-gray-400 text-xs ml-2">({Math.floor(flight.total_duration / 60)}h {flight.total_duration % 60}m)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-orange-600">¥{flight.price}</div>
                            <div className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              点击填入 &rarr;
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">航班号 (选填)</label>
                <input type="text" name="flightNumber" value={formData.flightNumber || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="例：CA1835" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">航司偏好 (选填)</label>
                <input type="text" name="airlinePreference" value={formData.airlinePreference || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="例：国航、南航" />
              </div>
            </div>
          </div>
        );
      case RequestType.HOTEL:
        const nights = calculateDuration(formData.checkInDate, formData.checkOutDate);
        return (
          <div className="space-y-6">
            {/* Unified Search Bar Container - 2 Row Grid Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">

                {/* City Input - Row 1, Col 1 */}
                <div className="lg:col-span-5 p-4 border-b border-gray-100 lg:border-r hover:bg-gray-50 transition-colors group cursor-pointer">
                  <label className="block text-xs text-gray-500 mb-1 ml-8 whitespace-nowrap">目的地/城市</label>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-indigo-500 mr-3 group-hover:text-indigo-600 flex-shrink-0" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city || ''}
                      onChange={handleInputChange}
                      className="w-full font-bold text-gray-900 placeholder-gray-300 outline-none text-lg bg-transparent truncate"
                      placeholder="北京 / 上海"
                      required
                    />
                  </div>
                </div>

                {/* Date Range - Row 1, Col 2 */}
                <div className="lg:col-span-7 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group cursor-pointer relative">
                  <label className="block text-xs text-gray-500 mb-1 ml-8 whitespace-nowrap">入住 - 退房</label>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-indigo-500 mr-3 group-hover:text-indigo-600 flex-shrink-0" />
                    <div className="flex items-center gap-3 w-full">
                      <input
                        type="date"
                        name="checkInDate"
                        value={formData.checkInDate || ''}
                        onChange={handleInputChange}
                        className="font-bold text-gray-900 outline-none text-base bg-transparent flex-1 cursor-pointer"
                        required
                      />
                      <span className="text-gray-300">-</span>
                      <input
                        type="date"
                        name="checkOutDate"
                        value={formData.checkOutDate || ''}
                        onChange={handleInputChange}
                        className="font-bold text-gray-900 outline-none text-base bg-transparent flex-1 cursor-pointer"
                        required
                      />
                    </div>
                    <div className="hidden xl:block ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {nights > 0 ? `${nights} 晚` : '0 晚'}
                    </div>
                  </div>
                </div>

                {/* Guests / Room Config - Row 2, Col 1 */}
                <div className="lg:col-span-4 p-4 border-b lg:border-b-0 border-gray-100 lg:border-r hover:bg-gray-50 transition-colors group cursor-pointer">
                  <label className="block text-xs text-gray-500 mb-1 ml-8 whitespace-nowrap">房间 & 住客</label>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-indigo-500 mr-3 group-hover:text-indigo-600 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <select
                        name="roomCount"
                        value={formData.roomCount}
                        onChange={handleInputChange}
                        className="font-bold text-gray-900 outline-none bg-transparent cursor-pointer hover:text-indigo-600 text-base"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}间</option>)}
                      </select>
                      <span className="text-gray-300">,</span>
                      <select
                        name="guestCount"
                        value={formData.guestCount}
                        onChange={handleInputChange}
                        className="font-bold text-gray-900 outline-none bg-transparent cursor-pointer hover:text-indigo-600 text-base"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}人</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Keywords - Row 2, Col 2 */}
                <div className="lg:col-span-6 p-4 border-b lg:border-b-0 border-gray-100 lg:border-r hover:bg-gray-50 transition-colors group cursor-pointer">
                  <label className="block text-xs text-gray-500 mb-1 ml-8 whitespace-nowrap">关键字/酒店名</label>
                  <div className="flex items-center">
                    <Search className="w-5 h-5 text-indigo-500 mr-3 group-hover:text-indigo-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={hotelKeywords}
                      onChange={(e) => setHotelKeywords(e.target.value)}
                      className="w-full font-bold text-gray-900 placeholder-gray-300 outline-none text-lg bg-transparent truncate"
                      placeholder="希尔顿 / 机场"
                    />
                  </div>
                </div>

                {/* Search Button - Row 2, Col 3 */}
                <div className="lg:col-span-2 p-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleSearchHotels}
                    disabled={isSearchingHotels}
                    className="w-full h-full min-h-[50px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-sm transition-all flex items-center justify-center whitespace-nowrap"
                  >
                    {isSearchingHotels ? <Loader2 className="w-6 h-6 animate-spin" /> : '搜索'}
                  </button>
                </div>
              </div>
            </div>

            {/* Hotel Results List (Ctrip Style) */}
            {showHotelResults && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-700 text-sm">查询结果 ({hotelResults.length})</h4>
                  <button type="button" onClick={() => setShowHotelResults(false)} className="text-xs text-gray-500 hover:text-gray-900 underline">收起结果</button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {hotelResults.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl text-center text-gray-500 border border-gray-200">
                      {isSearchingHotels ? '正在连接全球酒店数据库...' : '未找到符合条件的酒店，请尝试更换城市或日期。'}
                    </div>
                  ) : (
                    hotelResults.map((hotel, idx) => {
                      const badge = getRatingBadge(hotel.overall_rating || 0);
                      return (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow group">
                          {/* Image */}
                          <div className="w-full md:w-48 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            {hotel.thumbnail ? (
                              <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Building className="w-10 h-10" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{hotel.name}</h3>

                              {/* Rating Row */}
                              <div className="flex items-center mt-2 space-x-2">
                                {hotel.overall_rating ? (
                                  <>
                                    <div className={`text-white text-xs font-bold px-1.5 py-0.5 rounded-sm ${badge.color} flex items-center`}>
                                      <span className="text-sm mr-0.5">{hotel.overall_rating}</span>
                                      <span className="text-[10px]">/5</span>
                                    </div>
                                    <span className="text-blue-600 font-bold text-sm">{badge.label}</span>
                                    {hotel.reviews && <span className="text-xs text-gray-400">{hotel.reviews} 条点评</span>}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">暂无评分</span>
                                )}
                                <span className="text-gray-300">|</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-3 h-3 ${hotel.overall_rating && hotel.overall_rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                  ))}
                                </div>
                              </div>

                              {/* Location / Tags */}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {hotel.gps_coordinates && (
                                  <span className="flex items-center text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" /> 查看地图
                                  </span>
                                )}
                                {/* Mock Tags for UI look (SerpApi amenities data is complex/often missing in simple search) */}
                                {['免费取消', '立即确认', '含早餐'].map((tag, i) => (
                                  <span key={i} className="text-green-600 border border-green-200 px-1 rounded bg-green-50">{tag}</span>
                                ))}
                              </div>
                            </div>

                            {/* Room Types (Mock for UI density) */}
                            <div className="mt-3 text-xs text-gray-500 hidden md:block">
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                <span>高级大床房 • 25m² • 有窗</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Price & Action */}
                          <div className="flex flex-row md:flex-col justify-between items-end md:w-40 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                            <div className="text-right">
                              <div className="text-xs text-gray-400 line-through">¥{(hotel.rate_per_night?.extracted_lowest || 0) * 1.2}</div>
                              <div className="flex items-baseline justify-end gap-1">
                                <span className="text-xs text-gray-500 font-medium">每晚</span>
                                <span className="text-2xl font-bold text-blue-600">
                                  {hotel.rate_per_night?.lowest || '查看'}
                                </span>
                              </div>
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                                已含税费
                              </div>
                            </div>

                            <button
                              onClick={() => selectHotel(hotel)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm w-full md:w-auto mt-2 transition-colors"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">其他要求</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">房型备注</label>
                  <input type="text" name="roomType" value={formData.roomType || ''} placeholder="例：尽量高层、无烟房" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">星级要求</label>
                  <select name="starRating" value={formData.starRating} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="Any">不限</option>
                    <option value="3 Star">三星/舒适</option>
                    <option value="4 Star">四星/高档</option>
                    <option value="5 Star">五星/豪华</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">已选酒店 (自动填充)</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      <Building className="w-4 h-4" />
                    </span>
                    <input type="text" name="locationPreference" value={formData.locationPreference || ''} onChange={handleInputChange} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 sm:text-sm bg-gray-50" readOnly placeholder="在上方搜索结果中点击'查看详情'选择" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case RequestType.CAR_RENTAL:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">取车城市</label>
              <input type="text" name="pickupCity" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">车型</label>
              <select name="carType" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                <option value="Sedan">轿车</option>
                <option value="SUV">SUV</option>
                <option value="Van">商务车</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">取车日期</label>
              <input type="date" name="pickupDate" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">还车日期</label>
              <input type="date" name="returnDate" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">驾驶证号</label>
              <input type="text" name="drivingLicense" onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
            </div>
          </div>
        );
      case RequestType.OTHER:
        return (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">需求详情描述</label>
              <textarea
                name="description"
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border h-48"
                placeholder="请详细描述您的需求，例如：需要预定会议室、办理签证、购买火车票等..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">特殊要求 (选填)</label>
              <input
                type="text"
                name="requirements"
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="例如：需要发票、需要特定供应商等"
              />
            </div>
          </div>
        );
      default:
        return <div className="text-gray-500">该类型的表单暂未实现。</div>;
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建差旅需求</h1>
          <p className="text-gray-500">请选择您需要预定的业务类型。</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[
            { type: RequestType.FLIGHT, icon: Plane, label: '机票', desc: '预定国内/国际航班' },
            { type: RequestType.HOTEL, icon: Building, label: '酒店', desc: '预定出差住宿' },
            { type: RequestType.CAR_RENTAL, icon: Car, label: '租车', desc: '自驾租车服务' },
            { type: RequestType.CHARTER, icon: Bus, label: '包车', desc: '带司机的包车服务' },
            { type: RequestType.OTHER, icon: HelpCircle, label: '其他', desc: '自由输入需求' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleTypeSelect(item.type)}
              className="group relative bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-md transition-all text-left flex flex-col items-start"
            >
              <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors mb-4">
                <item.icon className="w-8 h-8 text-indigo-600 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{item.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              <div className="absolute top-4 right-4 text-indigo-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const getTitle = () => {
    switch (selectedType) {
      case RequestType.FLIGHT: return '机票';
      case RequestType.HOTEL: return '酒店';
      case RequestType.CAR_RENTAL: return '租车';
      case RequestType.CHARTER: return '包车';
      case RequestType.OTHER: return '其他业务';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => setStep(1)}
        className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回类型选择
      </button>

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden mb-8">
        <div className="px-6 md:px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getTitle()}需求</h2>
            <p className="text-sm text-gray-500">请填写详细信息。</p>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2">
            第 2 步
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Base Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">基础信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">出行目的</label>
                <input
                  type="text"
                  value={baseData.purpose}
                  onChange={(e) => setBaseData({ ...baseData, purpose: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="例：拜访 XX 客户"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">紧急程度</label>
                <select
                  value={baseData.urgency}
                  onChange={(e) => setBaseData({ ...baseData, urgency: e.target.value as Urgency })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value={Urgency.NORMAL}>普通</option>
                  <option value={Urgency.URGENT}>加急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">预算上限 (选填/自动)</label>
                <input
                  type="number"
                  value={baseData.budgetCap}
                  onChange={(e) => setBaseData({ ...baseData, budgetCap: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>

          {/* Travelers Info */}
          <section className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">出行人信息</h3>
              <button type="button" onClick={addTraveler} className="text-xs flex items-center text-indigo-600 font-bold hover:text-indigo-800">
                <UserPlus className="w-4 h-4 mr-1" /> 添加出行人
              </button>
            </div>

            <div className="space-y-4">
              {travelers.map((t, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => loadSelfProfile(index)}
                      className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 flex items-center"
                      title="从个人资料自动填充"
                    >
                      <UserIcon className="w-3 h-3 mr-1" /> 本人
                    </button>

                    {/* Frequent Contact Select */}
                    {userProfile?.contacts && userProfile.contacts.length > 0 && (
                      <div className="relative group">
                        <select
                          className="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 flex items-center appearance-none pr-6 cursor-pointer focus:outline-none"
                          onChange={(e) => {
                            if (e.target.value) {
                              loadContact(index, e.target.value);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>常用联系人</option>
                          {userProfile.contacts.map((c, cIdx) => (
                            <option key={cIdx} value={cIdx}>{c.name}</option>
                          ))}
                        </select>
                        <BookUser className="w-3 h-3 text-blue-600 absolute right-2 top-1.5 pointer-events-none" />
                      </div>
                    )}

                    {travelers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTraveler(index)}
                        className="text-red-400 hover:text-red-600 p-1 bg-white rounded border border-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase pt-1">出行人 #{index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8 md:mt-0">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                        placeholder="真实姓名"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">证件类型</label>
                      <select
                        value={t.idType}
                        onChange={(e) => updateTraveler(index, 'idType', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                      >
                        <option value="身份证">身份证</option>
                        <option value="护照">护照</option>
                        <option value="港澳通行证">港澳通行证</option>
                      </select>
                    </div>
                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                    placeholder="证件号"
                    required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">证件有效期</label>
                    <input
                      type="date"
                      value={t.idExpiryDate || ''}
                      onChange={(e) => updateTraveler(index, 'idExpiryDate', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                      placeholder="可选"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">手机号</label>
                    <input
                      type="text"
                      value={t.phone}
                      onChange={(e) => updateTraveler(index, 'phone', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm"
                      placeholder="联系电话"
                      required
                    />
                  </div>
                </div>
                </div>
              ))}
          </div>
        </section>

        {/* Specific Info */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">预定详情</h3>
          {renderScenarioForm()}
        </section>

        {/* Notes */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">备注说明</h3>
          <textarea
            value={baseData.notes}
            onChange={(e) => setBaseData({ ...baseData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border h-24"
            placeholder="如有特殊需求请在此填写..."
          />
        </section>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center"
          >
            {loading ? '提交中...' : '提交需求'}
            {!loading && <Check className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </form>
    </div>
    </div >
  );
};

export default CreateRequest;