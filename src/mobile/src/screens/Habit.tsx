import { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import clsx from "clsx";

import { api } from "../lib/axios";
import { generateProgressPercentage } from "../utils/generate-progress-percentage"

import { BackButton } from "../components/BackButton";
import { ProgressBar } from "../components/ProgressBar";
import { CheckBox } from "../components/CheckBox";
import { Loading } from "../components/loading";
import { HabitsEmpty } from "../components/HabitsEmpty";

interface Params {
  date: string;
}

interface dayInfoPropos {
  completedHabit: string[];
  possibleHabits: {
    id: string;
    title: string;
  }[];
}

export function Habit() {
  const [loading, setLoading] = useState(true);
  const [dayInfo, setDayInfo] = useState<dayInfoPropos | null>(null);
  const [completedHabits, setComletedHabits] = useState<string[]>([]);

  const route = useRoute();
  const { date } = route.params as Params;

  const parsedDate = dayjs(date);
  const isDateInPast = parsedDate.endOf('day').isBefore(new Date());
  const dayOfWeek = parsedDate.format('dddd');
  const dayAndMonth = parsedDate.format('DD/MM')

  const habitsProgress = dayInfo?.possibleHabits.length 
    ? generateProgressPercentage(dayInfo.possibleHabits.length, completedHabits.length) 
    : 0;

    async function fetchHabits() {
      try {
        setLoading(true);

        const response = await api.get("/day", { params: { date }})
        setDayInfo(response.data);
        setComletedHabits(response.data.completedHabits)

      } catch (error) {
        Alert.alert("Ops", "Nao foi possivel carregar as informacoes dos habitos")
      } 
      finally {
        setLoading(false)
      }
    }

    async function handleToggleHabit(habitId: string) {
      try {
        await api.patch(`/habits/${habitId}/toggle`)
        if (completedHabits.includes(habitId)) {
          setComletedHabits(prevState => prevState.filter(habit => habit !== habitId))
        } else {
          setComletedHabits(prevState => [...prevState, habitId])
        }
      } catch (error) {
          console.log(error);
          Alert.alert("Ops", "Nao foi possivel atulizar o status do habito.")
      }
    }
    useEffect(() => {
      fetchHabits();
    }, []);

    if (loading) {
      return (
        <Loading />
      )
    }


  return (
    <View className="flex-1 bg-background px-8 pt-16">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
      <BackButton />
        
      <Text className="mt-6 text-zinc-400 font-semibold text-base lowercase">
        {dayOfWeek}
      </Text>

      <Text className="text-white font-extrabold text-3xl">
        {dayAndMonth}
      </Text>

      <ProgressBar progress={habitsProgress}/>

      <View className={clsx("mt-6", {
        ["opacity-50"] : isDateInPast
      })}>
        {
          dayInfo?.possibleHabits ?
          dayInfo?.possibleHabits.map(habit => (
            <CheckBox
              key={habit.id}
              title={habit.title}
              checked={completedHabits.includes(habit.id)}
              disabled={isDateInPast}
              onPress={() => handleToggleHabit(habit.id)}
            />
          ))
          : <HabitsEmpty />
        }
      </View>

      {
        isDateInPast && (
        <Text className="text-white mt-10 text-center">
          Voce nao pode editar habitos de uma data passada
        </Text>
        )
      }
      </ScrollView>
    </View>
  )
}